import { db } from '../config/firebase';
import {
  doc,
  runTransaction,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

// ── Coin constants ────────────────────────────────────────────────────────────

export const INITIAL_COINS = 500;

// Online PvP (per player)
export const ONLINE_FEE = 50;
export const ONLINE_PRIZE = 100;      // winner receives; net gain = +50
export const ONLINE_DRAW_REFUND = 40; // draw refunds fee minus 10-coin penalty

// vs AI (logged-in only; draw refunds fee minus draw penalty)
export const AI_CONFIG: Record<string, { fee: number; prize: number; drawRefund: number }> = {
  easy:   { fee: 10, prize: 20, drawRefund: 5  }, // 5-coin draw penalty
  medium: { fee: 25, prize: 50, drawRefund: 15 }, // 10-coin draw penalty
  hard:   { fee: 40, prize: 80, drawRefund: 30 }, // 10-coin draw penalty
};

export const GUEST_LIMIT = 10; // online games per hour for guest users

// ── Firestore coin operations ─────────────────────────────────────────────────

class InsufficientCoinsError extends Error {}

export async function deductCoins(
  uid: string,
  amount: number,
): Promise<'ok' | 'insufficient'> {
  if (!db) return 'ok';
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db!, 'users', uid);
      const snap = await tx.get(ref);
      const coins = (snap.data()?.coins as number) ?? 0;
      if (coins < amount) throw new InsufficientCoinsError();
      tx.update(ref, { coins: increment(-amount), updatedAt: serverTimestamp() });
    });
    return 'ok';
  } catch (e) {
    if (e instanceof InsufficientCoinsError) return 'insufficient';
    throw e;
  }
}

export async function awardCoins(uid: string, amount: number): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    coins: increment(amount),
    updatedAt: serverTimestamp(),
  });
}

// ── Guest rate-limit (localStorage) ──────────────────────────────────────────

const GUEST_KEY = 'ttt_guest_games';
const HOUR_MS = 60 * 60 * 1000;

interface GuestRecord { timestamps: number[] }

function loadGuest(): GuestRecord {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : { timestamps: [] };
  } catch {
    return { timestamps: [] };
  }
}

function saveGuest(r: GuestRecord) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(r));
}

function freshTimestamps(): number[] {
  const now = Date.now();
  return loadGuest().timestamps.filter((t) => now - t < HOUR_MS);
}

export function getGuestGamesRemaining(): number {
  return Math.max(0, GUEST_LIMIT - freshTimestamps().length);
}

export function canGuestPlay(): boolean {
  return getGuestGamesRemaining() > 0;
}

export function recordGuestGame(): void {
  const ts = freshTimestamps();
  ts.push(Date.now());
  saveGuest({ timestamps: ts });
}

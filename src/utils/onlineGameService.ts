// Firestore collection: online_rooms
// Firestore security rules must allow read/write to this collection.
// Suggested rules for development:
//   match /online_rooms/{roomCode} { allow read, write: if true; }

import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export interface OnlinePlayer {
  uid: string;
  name: string;
}

export interface OnlineRoom {
  roomCode: string;
  boardSize: number;
  board: (string | null)[];
  isXNext: boolean;
  gameOver: boolean;
  winner: string | null;
  winningLine: number[] | null;
  player1: OnlinePlayer | null;
  player2: OnlinePlayer | null;
  // 'waiting'    = room created, no opponent yet
  // 'confirming' = both players present, waiting for both to ready up
  // 'playing'    = game in progress
  // 'finished'   = game over or forfeited
  status: 'waiting' | 'confirming' | 'playing' | 'finished';
  ready?: { player1: boolean; player2: boolean };
  rematch?: { player1: boolean; player2: boolean };
  expireAt: unknown; // Firestore TTL field — document auto-deleted after this date
  createdAt: unknown;
  updatedAt: unknown;
}

const ROOMS = 'online_rooms';

const mins = (n: number) => new Date(Date.now() + n * 60 * 1000);

function genCode(): string {
  return String(10000 + Math.floor(Math.random() * 90000));
}

export function getOrCreatePlayerId(): string {
  const KEY = 'ttt_anon_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function createRoom(
  uid: string,
  name: string,
  boardSize: number,
): Promise<string> {
  if (!db) throw new Error('Firebase not configured');

  let code = genCode();
  for (let i = 0; i < 10; i++) {
    const snap = await getDoc(doc(db, ROOMS, code));
    if (!snap.exists() || snap.data()?.status === 'finished') break;
    code = genCode();
  }

  await setDoc(doc(db, ROOMS, code), {
    roomCode: code,
    boardSize,
    board: Array(boardSize * boardSize).fill(null),
    isXNext: true,
    gameOver: false,
    winner: null,
    winningLine: null,
    player1: { uid, name },
    player2: null,
    status: 'waiting',
    expireAt: mins(10), // waiting rooms expire in 10 min if nobody joins
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return code;
}

export async function joinRoomByCode(
  code: string,
  uid: string,
  name: string,
): Promise<'ok' | 'not_found' | 'full' | 'self'> {
  if (!db) throw new Error('Firebase not configured');

  const ref = doc(db, ROOMS, code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 'not_found';

  const data = snap.data() as OnlineRoom;
  if (data.status !== 'waiting' || data.player2 !== null) return 'full';
  if (data.player1?.uid === uid) return 'self';

  await updateDoc(ref, {
    player2: { uid, name },
    status: 'confirming',
    ready: { player1: false, player2: false },
    expireAt: mins(5), // 5 min to complete the ready-check or room is cleaned up
    updatedAt: serverTimestamp(),
  });

  return 'ok';
}

export async function findOrCreateRandomRoom(
  uid: string,
  name: string,
  boardSize: number,
): Promise<{ code: string; isNew: boolean }> {
  if (!db) throw new Error('Firebase not configured');

  const q = query(
    collection(db, ROOMS),
    where('status', '==', 'waiting'),
    where('boardSize', '==', boardSize),
    limit(10),
  );

  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data() as OnlineRoom;
    if (data.player1?.uid !== uid && !data.player2) {
      await updateDoc(d.ref, {
        player2: { uid, name },
        status: 'playing',
        expireAt: mins(30), // 30 min to finish the game
        updatedAt: serverTimestamp(),
      });
      return { code: data.roomCode, isNew: false };
    }
  }

  const code = await createRoom(uid, name, boardSize);
  return { code, isNew: true };
}

export function subscribeRoom(
  code: string,
  cb: (room: OnlineRoom | null) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, ROOMS, code),
    (s) => { cb(s.exists() ? (s.data() as OnlineRoom) : null); },
    (err) => {
      console.error('[online] room snapshot error:', err);
      if (onError) onError(err);
    },
  );
}

export async function confirmReady(
  code: string,
  role: 'player1' | 'player2',
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, ROOMS, code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as OnlineRoom;
  const current = data.ready ?? { player1: false, player2: false };
  const updated = { ...current, [role]: true };
  if (updated.player1 && updated.player2) {
    await updateDoc(ref, { status: 'playing', ready: updated, expireAt: mins(30), updatedAt: serverTimestamp() });
  } else {
    await updateDoc(ref, { [`ready.${role}`]: true, updatedAt: serverTimestamp() });
  }
}

export async function pushMove(
  code: string,
  board: (string | null)[],
  isXNext: boolean,
  gameOver: boolean,
  winner: string | null,
  winningLine: number[] | null,
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, ROOMS, code), {
    board,
    isXNext,
    gameOver,
    winner,
    winningLine: winningLine ?? null,
    status: gameOver ? 'finished' : 'playing',
    expireAt: gameOver ? mins(10) : mins(30), // 10 min after game ends, 30 min while playing
    updatedAt: serverTimestamp(),
  });
}

export async function peekRoom(code: string): Promise<OnlineRoom | null> {
  if (!db) throw new Error('Firebase not configured');
  const snap = await getDoc(doc(db, ROOMS, code));
  return snap.exists() ? (snap.data() as OnlineRoom) : null;
}

export async function findWaitingRoom(
  uid: string,
  boardSize: number,
): Promise<OnlineRoom | null> {
  if (!db) throw new Error('Firebase not configured');
  const q = query(
    collection(db, ROOMS),
    where('status', '==', 'waiting'),
    where('boardSize', '==', boardSize),
    limit(10),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data() as OnlineRoom;
    if (data.player1?.uid !== uid && !data.player2) return data;
  }
  return null;
}

export async function requestRematch(
  code: string,
  role: 'player1' | 'player2',
  boardSize: number,
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, ROOMS, code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as OnlineRoom;

  const current = data.rematch ?? { player1: false, player2: false };
  const updated = { ...current, [role]: true };

  if (updated.player1 && updated.player2) {
    // Both agreed — reset board for a fresh game
    await updateDoc(ref, {
      board: Array(boardSize * boardSize).fill(null),
      isXNext: true,
      gameOver: false,
      winner: null,
      winningLine: null,
      status: 'playing',
      rematch: { player1: false, player2: false },
      expireAt: mins(30), // fresh 30 min for the rematch
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      [`rematch.${role}`]: true,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function cancelWaitingRoom(code: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, ROOMS, code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as OnlineRoom;
  if (data.status === 'waiting') {
    await updateDoc(ref, { status: 'finished', expireAt: mins(2), updatedAt: serverTimestamp() });
  }
}

export async function forfeitRoom(
  code: string,
  losingSymbol: 'X' | 'O',
): Promise<void> {
  if (!db) return;
  const ref = doc(db, ROOMS, code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as OnlineRoom;
  if (data.status === 'finished') return;
  await updateDoc(ref, {
    gameOver: true,
    winner: losingSymbol === 'X' ? 'O' : 'X',
    status: 'finished',
    expireAt: mins(10), // 10 min after forfeit
    updatedAt: serverTimestamp(),
  });
}

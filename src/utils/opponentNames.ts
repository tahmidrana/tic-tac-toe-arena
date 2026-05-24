import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Pool of random opponent names used to fake an online match.
 *
 * Source of truth is Firestore (`config/opponentNames` document with a
 * `names: string[]` field) so the pool can be curated without redeploying.
 * If Firebase is unconfigured or the doc is missing we fall back to this
 * baked-in list, which is intentionally large and varied.
 */
const FALLBACK_NAMES: string[] = [
  // Common gender-neutral first names
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Quinn', 'Riley',
  'Avery', 'Drew', 'Skyler', 'Jamie', 'Rowan', 'Charlie', 'Finley', 'Reese',
  'Devon', 'Blake', 'Cameron', 'Hayden', 'Phoenix', 'Sage', 'River', 'Kai',
  'Aiden', 'Liam', 'Noah', 'Mason', 'Ethan', 'Logan', 'Luna', 'Mia', 'Zoe',
  'Oliver', 'Lucas', 'Henry', 'Owen', 'Wyatt', 'Levi', 'Caleb', 'Isaac',
  'Maya', 'Aria', 'Nora', 'Ivy', 'Ruby', 'Hazel', 'Stella', 'Violet',
  'Emma', 'Ava', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Harper',
  'Ezra', 'Asher', 'Leo', 'Jude', 'Eli', 'Theo', 'Felix', 'Milo',
  'Nova', 'Wren', 'Indigo', 'Ocean', 'Cedar', 'Lake', 'Storm', 'Echo',
  // Gamer-style handles
  'NightOwl', 'PixelKing', 'ShadowFox', 'NeonViper', 'StormRider', 'IceWolf',
  'SilentBlade', 'CyberAce', 'QuickDraw', 'GhostRunner', 'MysticEdge', 'VoidWalker',
  'CrimsonHawk', 'EmberFox', 'SteelHeart', 'FrostBite', 'StarGazer', 'MoonChaser',
  'ThunderPaws', 'WildSpark', 'IronWill', 'JadeFury', 'NovaStrike', 'ZenithX',
  // Initials / short tags
  'JK', 'TM', 'AL', 'BB', 'CJ', 'DM', 'EJ', 'FG', 'GH', 'KP',
  // International first names
  'Hiroshi', 'Yuki', 'Sakura', 'Mateo', 'Sofia', 'Lucia', 'Diego', 'Camila',
  'Aarav', 'Priya', 'Arjun', 'Ananya', 'Liam', 'Aisha', 'Omar', 'Layla',
  'Mei', 'Jin', 'Ling', 'Wei', 'Ahmed', 'Fatima', 'Rashid', 'Zara',
];

const ANONYMOUS_CHANCE = 0.15;
const SUFFIX_CHANCE = 0.55;

let cachedNames: string[] = FALLBACK_NAMES;
let loaded = false;

/**
 * Fetch the curated name pool from Firestore once. Safe to call multiple
 * times; later calls return the cached promise.
 */
let loadPromise: Promise<void> | null = null;
export function loadOpponentNames(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, 'config', 'opponentNames'));
      if (snap.exists()) {
        const data = snap.data() as { names?: unknown };
        if (Array.isArray(data.names) && data.names.length > 0) {
          cachedNames = data.names.filter(
            (n): n is string => typeof n === 'string' && n.length > 0,
          );
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('opponentNames: Firestore fetch failed, using fallback list', e);
    }
  })();
  return loadPromise;
}

/** Whether the active pool came from Firestore (for debugging/tests). */
export function isPoolFromFirestore(): boolean {
  return loaded;
}

/**
 * Generate a random opponent display name.
 *  - ~15% of the time the opponent is "Anonymous" (with optional numeric tag).
 *  - Otherwise pick from the pool and optionally append a 2–4-digit suffix
 *    for a username-y feel.
 */
export function randomOpponentName(): string {
  if (Math.random() < ANONYMOUS_CHANCE) {
    return Math.random() < 0.5
      ? 'Anonymous'
      : `Anonymous${Math.floor(Math.random() * 999) + 1}`;
  }
  const base = cachedNames[Math.floor(Math.random() * cachedNames.length)];
  if (Math.random() < SUFFIX_CHANCE) {
    return `${base}${Math.floor(Math.random() * 9989) + 10}`;
  }
  return base;
}

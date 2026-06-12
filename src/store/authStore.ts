import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

/**
 * Tiny shared auth store.
 * Module-scoped state + listener fan-out so every `useAuth()` caller stays
 * in sync without us having to add a context provider.
 */

type Listener = () => void;

let currentUser: FirebaseUser | null = null;
let initialized = false;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    initialized = true;
    notify();
  });
} else {
  initialized = true; // nothing to wait for
}

export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* in .env.local');
  }
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function updateDisplayName(name: string): Promise<void> {
  if (!auth?.currentUser) throw new Error('Not signed in');
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name cannot be empty');
  await updateProfile(auth.currentUser, { displayName: trimmed });
  // Sync to Firestore users doc so leaderboard reflects the change immediately
  if (db) {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      name: trimmed,
      updatedAt: serverTimestamp(),
    });
  }
  // Force re-notify all listeners so components pick up the new displayName
  currentUser = auth.currentUser;
  notify();
}

export function useAuth(): AuthState {
  const [, force] = useState(0);

  useEffect(() => {
    const listener: Listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    user: currentUser,
    loading: !initialized,
    isConfigured: isFirebaseConfigured,
    signInWithGoogle,
    signOut,
    updateDisplayName,
  };
}

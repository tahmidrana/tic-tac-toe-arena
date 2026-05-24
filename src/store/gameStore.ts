import { useCallback, useEffect, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

export interface User {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface GameState {
  players: { player1: User; player2: User };
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  gameOver: boolean;
  winner: string | null;
}

const STORAGE_KEY = 'ticTacToeUsers';
const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Player 1', wins: 0, losses: 0, draws: 0 },
  { id: '2', name: 'Player 2', wins: 0, losses: 0, draws: 0 },
];

const loadUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
};

export const useGameStore = () => {
  const [users, setUsers] = useState<User[]>(loadUsers);
  // Track the currently-signed-in Firebase uid so write callbacks know
  // whether to mirror player1 mutations to Firestore.
  const signedInUidRef = useRef<string | null>(null);

  // Subscribe to auth + Firestore so player1 reflects the signed-in user.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) return;

    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Tear down the previous user's snapshot listener.
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!fbUser) {
        // Signed out — restore the local player1 from localStorage.
        signedInUidRef.current = null;
        setUsers((prev) => {
          const local = loadUsers();
          return [local[0] ?? DEFAULT_USERS[0], prev[1] ?? DEFAULT_USERS[1]];
        });
        return;
      }

      signedInUidRef.current = fbUser.uid;
      const userRef = doc(db!, 'users', fbUser.uid);

      // Create the doc on first sign-in.
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: fbUser.displayName ?? 'Player',
          email: fbUser.email ?? null,
          photoURL: fbUser.photoURL ?? null,
          wins: 0,
          losses: 0,
          draws: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Live-sync player1 from Firestore.
      unsubDoc = onSnapshot(userRef, (s) => {
        if (!s.exists()) return;
        const data = s.data();
        const player1: User = {
          id: fbUser.uid,
          name: (data.name as string) || fbUser.displayName || 'Player',
          wins: (data.wins as number) ?? 0,
          losses: (data.losses as number) ?? 0,
          draws: (data.draws as number) ?? 0,
        };
        setUsers((prev) => [player1, prev[1] ?? DEFAULT_USERS[1]]);
      });
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubAuth();
    };
  }, []);

  /** Apply a Firestore mutation if `userId` is the signed-in player. */
  const mirrorToFirestore = useCallback(
    (userId: string, fields: Record<string, unknown>) => {
      if (!db) return;
      const uid = signedInUidRef.current;
      if (!uid || uid !== userId) return;
      updateDoc(doc(db, 'users', uid), {
        ...fields,
        updatedAt: serverTimestamp(),
      }).catch((e) => console.error('Firestore sync failed:', e));
    },
    [],
  );

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      saveUsers(updated);
      return updated;
    });
  }, []);

  const recordWin = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, wins: u.wins + 1 } : u,
        );
        saveUsers(updated);
        return updated;
      });
      mirrorToFirestore(userId, { wins: increment(1) });
    },
    [mirrorToFirestore],
  );

  const recordLoss = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, losses: u.losses + 1 } : u,
        );
        saveUsers(updated);
        return updated;
      });
      mirrorToFirestore(userId, { losses: increment(1) });
    },
    [mirrorToFirestore],
  );

  const recordDraw = useCallback(
    (userIds: string[]) => {
      setUsers((prev) => {
        const updated = prev.map((u) =>
          userIds.includes(u.id) ? { ...u, draws: u.draws + 1 } : u,
        );
        saveUsers(updated);
        return updated;
      });
      userIds.forEach((uid) => mirrorToFirestore(uid, { draws: increment(1) }));
    },
    [mirrorToFirestore],
  );

  const renameUser = useCallback(
    (userId: string, newName: string) => {
      updateUser(userId, { name: newName });
      mirrorToFirestore(userId, { name: newName });
    },
    [updateUser, mirrorToFirestore],
  );

  const resetStats = useCallback(
    (userId: string) => {
      updateUser(userId, { wins: 0, losses: 0, draws: 0 });
      mirrorToFirestore(userId, { wins: 0, losses: 0, draws: 0 });
    },
    [updateUser, mirrorToFirestore],
  );

  const getRankedUsers = useCallback((): User[] => {
    return [...users].sort((a, b) => {
      const aWinRate = a.wins / (a.wins + a.losses + a.draws || 1);
      const bWinRate = b.wins / (b.wins + b.losses + b.draws || 1);
      if (bWinRate !== aWinRate) return bWinRate - aWinRate;
      return b.wins - a.wins;
    });
  }, [users]);

  return {
    users,
    updateUser,
    recordWin,
    recordLoss,
    recordDraw,
    renameUser,
    resetStats,
    getRankedUsers,
  };
};

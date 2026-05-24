import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './authStore';

export interface LeaderboardUser {
  id: string;
  name: string;
  photoURL: string | null;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number; // 0..1
}

export interface LeaderboardState {
  users: LeaderboardUser[];
  loading: boolean;
  error: string | null;
  /** 1-based rank of the signed-in user; null if not signed in or not yet fetched. */
  currentUserRank: number | null;
  currentUser: LeaderboardUser | null;
}

// Pull a large-but-finite slice; we sort by derived win-rate client-side
// because Firestore can't compute it server-side.
const FETCH_LIMIT = 500;

export function useGlobalLeaderboard(): LeaderboardState {
  const { user, isConfigured } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(isConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }

    // orderBy wins as a server-side first pass so the fetched slice
    // is biased toward the people who matter for ranking.
    const q = query(collection(db, 'users'), orderBy('wins', 'desc'), limit(FETCH_LIMIT));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: LeaderboardUser[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const wins = (data.wins as number) ?? 0;
          const losses = (data.losses as number) ?? 0;
          const draws = (data.draws as number) ?? 0;
          const total = wins + losses + draws;
          return {
            id: d.id,
            name: (data.name as string) ?? 'Player',
            photoURL: (data.photoURL as string | null) ?? null,
            wins,
            losses,
            draws,
            totalGames: total,
            winRate: total === 0 ? 0 : wins / total,
          };
        });

        // Sort: win rate desc, then total wins desc, then more games desc (active players).
        list.sort((a, b) => {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.totalGames - a.totalGames;
        });

        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Leaderboard subscription error:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [isConfigured]);

  const idx = user ? users.findIndex((u) => u.id === user.uid) : -1;

  return {
    users,
    loading,
    error,
    currentUserRank: idx >= 0 ? idx + 1 : null,
    currentUser: idx >= 0 ? users[idx] : null,
  };
}

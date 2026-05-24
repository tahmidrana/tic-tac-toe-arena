import { useState, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface GameState {
  players: {
    player1: User;
    player2: User;
  };
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  gameOver: boolean;
  winner: string | null;
}

// Store user data in localStorage
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

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      );
      saveUsers(updated);
      return updated;
    });
  }, []);

  const recordWin = useCallback((userId: string) => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map((user) =>
        user.id === userId ? { ...user, wins: user.wins + 1 } : user
      );
      saveUsers(updated);
      return updated;
    });
  }, []);

  const recordLoss = useCallback((userId: string) => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map((user) =>
        user.id === userId ? { ...user, losses: user.losses + 1 } : user
      );
      saveUsers(updated);
      return updated;
    });
  }, []);

  const recordDraw = useCallback((userIds: string[]) => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map((user) =>
        userIds.includes(user.id)
          ? { ...user, draws: user.draws + 1 }
          : user
      );
      saveUsers(updated);
      return updated;
    });
  }, []);

  const renameUser = useCallback((userId: string, newName: string) => {
    updateUser(userId, { name: newName });
  }, [updateUser]);

  const resetStats = useCallback((userId: string) => {
    updateUser(userId, { wins: 0, losses: 0, draws: 0 });
  }, [updateUser]);

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

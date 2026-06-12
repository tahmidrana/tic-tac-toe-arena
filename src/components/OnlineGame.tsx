import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { isFirebaseConfigured } from '../config/firebase';
import { calculateWinner } from '../utils/winLogic';
import { randomOpponentName } from '../utils/opponentNames';
import {
  getOrCreatePlayerId,
  createRoom,
  joinRoomByCode,
  subscribeRoom,
  pushMove,
  cancelWaitingRoom,
  forfeitRoom,
  requestRematch,
  confirmReady,
  findWaitingRoom,
  type OnlineRoom,
} from '../utils/onlineGameService';
import {
  deductCoins,
  awardCoins,
  canGuestPlay,
  getGuestGamesRemaining,
  recordGuestGame,
  ONLINE_FEE,
  ONLINE_PRIZE,
  ONLINE_DRAW_REFUND,
  GUEST_LIMIT,
} from '../utils/coinService';
import { Confetti } from './Confetti';
import { WinAnimation } from './WinAnimation';
import { LossAnimation } from './LossAnimation';

type Phase = 'lobby' | 'loading' | 'waiting' | 'readycheck' | 'playing';
type BoardSize = 3 | 4 | 5 | 6;
const TURN_SECONDS = 15;

const BOARD_SIZES: BoardSize[] = [3, 4, 5, 6];

const SEARCH_MESSAGES = [
  'Scanning the arena…',
  'Hunting for a worthy rival…',
  'Almost found one…',
  'Locking in your match…',
];

function getOrCreateGuestName(): string {
  return randomOpponentName();
}

export function OnlineGame() {
  const { user } = useAuth();
  const { users, recordWin, recordLoss, recordDraw } = useGameStore();
  const myLocalPlayer = users[0];

  const guestName = useMemo(() => getOrCreateGuestName(), []);

  const [phase, setPhase] = useState<Phase>('lobby');
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myRole, setMyRole] = useState<'player1' | 'player2' | null>(null);
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchMsg, setSearchMsg] = useState(SEARCH_MESSAGES[0]);
  const [waitElapsed, setWaitElapsed] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showWinNotice, setShowWinNotice] = useState(true);
  const [showLossNotice, setShowLossNotice] = useState(true);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [showRematchDialog, setShowRematchDialog] = useState(false);
  const [readyConfirmed, setReadyConfirmed] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [guestRemaining, setGuestRemaining] = useState(() => getGuestGamesRemaining());
  const [coinDelta, setCoinDelta] = useState<number | undefined>(undefined);

  const roomCodeRef = useRef('');
  const myRoleRef = useRef<'player1' | 'player2' | null>(null);
  const phaseRef = useRef<Phase>('lobby');
  const resultRecordedRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const roomRef = useRef<OnlineRoom | null>(null);

  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const getPlayerId = useCallback(() => user?.uid ?? getOrCreatePlayerId(), [user]);
  const getPlayerName = useCallback(
    () => user?.displayName ?? guestName,
    [user, guestName],
  );

  const isGuest = !user;
  const bothLoggedIn =
    room?.player1?.isGuest === false && room?.player2?.isGuest === false;

  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { myRoleRef.current = myRole; }, [myRole]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roomRef.current = room; }, [room]);

  useEffect(() => {
    setTimeLeft(TURN_SECONDS);
  }, [room?.isXNext, room?.gameOver]);

  useEffect(() => {
    if (phase !== 'playing' || !room || room.gameOver || !myRole) return;

    if (timeLeft <= 0) {
      // Only auto-play a random cell when it's actually my turn
      const mySymbol = myRole === 'player1' ? 'X' : 'O';
      const isMyTurn = (mySymbol === 'X' && room.isXNext) || (mySymbol === 'O' && !room.isXNext);
      if (isMyTurn) {
        const r = roomRef.current;
        if (!r) return;
        const empties = r.board.reduce<number[]>((acc, v, i) => {
          if (v === null) acc.push(i);
          return acc;
        }, []);
        if (empties.length > 0) {
          handleCellClick(empties[Math.floor(Math.random() * empties.length)]);
        }
      }
      return;
    }

    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, room?.gameOver, room?.isXNext, myRole]);

  useEffect(() => {
    if (!roomCode) return;
    if (unsubRef.current) unsubRef.current();

    unsubRef.current = subscribeRoom(
      roomCode,
      (r) => {
        setRoom(r);
        // player1: waiting → readycheck when player2 joins
        if (r?.status === 'confirming' && phaseRef.current === 'waiting') {
          setReadyConfirmed(false);
          setPhase('readycheck');
        }
        // both players: readycheck → playing when both confirm ready
        if (r?.status === 'playing' && phaseRef.current === 'readycheck') {
          setPhase('playing');
          if (isGuest) {
            recordGuestGame();
            setGuestRemaining(getGuestGamesRemaining());
          }
        }
        if (r === null && phaseRef.current !== 'lobby') {
          setError('Room no longer exists.');
          resetToLobby();
        }
      },
      (err) => {
        setError(`Connection error: ${err.message}`);
        resetToLobby();
      },
    );

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    if (!room?.gameOver || resultRecordedRef.current || !myRole) return;
    resultRecordedRef.current = true;
    const mySymbol = myRole === 'player1' ? 'X' : 'O';
    const coinStakes = user && bothLoggedIn;

    if (room.winner === 'draw') {
      recordDraw([myLocalPlayer.id]);
      if (coinStakes) {
        awardCoins(user.uid, ONLINE_DRAW_REFUND).catch(console.error);
        setCoinDelta(ONLINE_DRAW_REFUND);
      }
    } else if (room.winner === mySymbol) {
      recordWin(myLocalPlayer.id);
      if (coinStakes) {
        awardCoins(user.uid, ONLINE_PRIZE).catch(console.error);
        setCoinDelta(ONLINE_PRIZE);
      }
    } else {
      recordLoss(myLocalPlayer.id);
      // Loser: coins already deducted at ready-check
      if (coinStakes) setCoinDelta(-ONLINE_FEE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameOver, myRole, room?.winner, myLocalPlayer?.id]);

  useEffect(() => {
    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      const code = roomCodeRef.current;
      const role = myRoleRef.current;
      const p = phaseRef.current;
      if (!code || !role) return;
      if (p === 'waiting' || p === 'readycheck') cancelWaitingRoom(code);
      else if (p === 'playing') forfeitRoom(code, role === 'player1' ? 'X' : 'O');
    };
  }, []);

  // Detect rematch reset — when board comes back to a fresh state while we're still in the room
  const prevGameOverRef = useRef(false);
  useEffect(() => {
    if (!room) return;
    if (prevGameOverRef.current && !room.gameOver && room.status === 'playing') {
      // Board was just reset for a rematch
      resultRecordedRef.current = false;
      setRematchRequested(false);
      setShowRematchDialog(false);
      setShowWinNotice(true);
      setShowLossNotice(true);
      setCoinDelta(undefined);
      setTimeLeft(TURN_SECONDS);
    }
    prevGameOverRef.current = room.gameOver;
  }, [room?.gameOver, room?.status]);

  // Show rematch dialog after win/loss animation has had time to display
  useEffect(() => {
    if (!room?.gameOver) return;
    const id = setTimeout(() => setShowRematchDialog(true), 1500);
    return () => clearTimeout(id);
  }, [room?.gameOver]);

  useEffect(() => {
    if (!isSearching) return;
    let idx = 0;
    const msgInterval = setInterval(() => {
      idx = (idx + 1) % SEARCH_MESSAGES.length;
      setSearchMsg(SEARCH_MESSAGES[idx]);
    }, 2500);
    const tick = setInterval(() => setWaitElapsed((s) => s + 1), 1000);
    return () => { clearInterval(msgInterval); clearInterval(tick); };
  }, [isSearching]);

  const resetToLobby = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setPhase('lobby');
    setRoomCode('');
    setMyRole(null);
    setRoom(null);
    setError(null);
    setMoveError(null);
    setJoinCode('');
    setShowJoinInput(false);
    resultRecordedRef.current = false;
    setIsSearching(false);
    setWaitElapsed(0);
    setShowWinNotice(true);
    setShowLossNotice(true);
    setRematchRequested(false);
    setShowRematchDialog(false);
    setReadyConfirmed(false);
    setCoinDelta(undefined);
  };

  const handleCreateRoom = async () => {
    setError(null);
    if (isGuest && !canGuestPlay()) {
      setError(`Guest limit reached — you can play ${GUEST_LIMIT} free games per hour. Sign in for unlimited play!`);
      return;
    }
    setPhase('loading');
    try {
      const code = await createRoom(getPlayerId(), getPlayerName(), boardSize, isGuest);
      setRoomCode(code);
      setMyRole('player1');
      setPhase('waiting');
      setWaitElapsed(0);
    } catch (e) {
      console.error('[online] createRoom failed:', e);
      setError('Failed to create room. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const handleJoinByCode = async () => {
    const code = joinCode.trim();
    if (code.length !== 5 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 5-digit code.');
      return;
    }
    if (isGuest && !canGuestPlay()) {
      setError(`Guest limit reached — you can play ${GUEST_LIMIT} free games per hour. Sign in for unlimited play!`);
      return;
    }
    setError(null);
    setPhase('loading');
    try {
      const result = await joinRoomByCode(code, getPlayerId(), getPlayerName(), isGuest);
      if (result === 'ok') {
        setRoomCode(code);
        setMyRole('player2');
        setReadyConfirmed(false);
        setPhase('readycheck');
      } else {
        const msgs: Record<string, string> = {
          not_found: 'Room not found. Double-check the code.',
          full: 'That room is already full.',
          self: "You can't join your own room.",
        };
        setError(msgs[result] ?? 'Could not join room.');
        setPhase('lobby');
      }
    } catch (e) {
      console.error('[online] joinRoom failed:', e);
      setError('Failed to join room. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const handleFindRandom = async () => {
    setError(null);
    if (isGuest && !canGuestPlay()) {
      setError(`Guest limit reached — you can play ${GUEST_LIMIT} free games per hour. Sign in for unlimited play!`);
      return;
    }
    setIsSearching(true);
    setWaitElapsed(0);
    setPhase('loading');
    try {
      const found = await findWaitingRoom(getPlayerId(), boardSize);
      if (found) {
        setIsSearching(false);
        const result = await joinRoomByCode(found.roomCode, getPlayerId(), getPlayerName(), isGuest);
        if (result === 'ok') {
          setRoomCode(found.roomCode);
          setMyRole('player2');
          setReadyConfirmed(false);
          setPhase('readycheck');
        } else {
          const code = await createRoom(getPlayerId(), getPlayerName(), boardSize, isGuest);
          setRoomCode(code);
          setMyRole('player1');
          setPhase('waiting');
          setWaitElapsed(0);
        }
      } else {
        const code = await createRoom(getPlayerId(), getPlayerName(), boardSize, isGuest);
        setRoomCode(code);
        setMyRole('player1');
        setPhase('waiting');
        setWaitElapsed(0);
        setIsSearching(false);
      }
    } catch (e) {
      console.error('[online] findRandom failed:', e);
      setError('Failed to find a match. Check your connection and try again.');
      setPhase('lobby');
      setIsSearching(false);
    }
  };

  const handleCellClick = async (index: number) => {
    if (!room || !myRole || !roomCode) return;
    if (room.gameOver || room.board[index] !== null) return;
    const mySymbol = myRole === 'player1' ? 'X' : 'O';
    const isMyTurn =
      (mySymbol === 'X' && room.isXNext) ||
      (mySymbol === 'O' && !room.isXNext);
    if (!isMyTurn) return;

    setMoveError(null);
    const prevRoom = room;
    const newBoard = [...room.board];
    newBoard[index] = mySymbol;
    const { winner, line } = calculateWinner(newBoard, room.boardSize);
    const full = newBoard.every((c) => c !== null);
    const isOver = !!winner || full;
    const newWinner = winner ?? (full ? 'draw' : null);

    setRoom({
      ...prevRoom,
      board: newBoard,
      isXNext: !prevRoom.isXNext,
      gameOver: isOver,
      winner: newWinner,
      winningLine: line ?? null,
      status: isOver ? 'finished' : 'playing',
    });

    try {
      await pushMove(roomCode, newBoard, !prevRoom.isXNext, isOver, newWinner, line);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[online] pushMove failed:', e);
      setMoveError(`Move failed: ${msg}`);
      setRoom(prevRoom);
    }
  };

  const handleLeave = async () => {
    setShowLeaveConfirm(false);
    if (phase === 'waiting') {
      await cancelWaitingRoom(roomCode).catch(console.error);
    } else if (phase === 'playing' && room && !room.gameOver) {
      await forfeitRoom(roomCode, myRole === 'player1' ? 'X' : 'O').catch(console.error);
    }
    resetToLobby();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(console.error);
  };

  const handleReady = async () => {
    if (!myRole || !roomCode) return;
    setCoinError(null);

    // Deduct entry fee if both players are logged-in users
    if (user && bothLoggedIn) {
      const result = await deductCoins(user.uid, ONLINE_FEE);
      if (result === 'insufficient') {
        setCoinError(`Not enough coins — you need ${ONLINE_FEE} 🪙 to enter this match.`);
        return;
      }
    }

    setReadyConfirmed(true);
    try {
      await confirmReady(roomCode, myRole);
    } catch (e) {
      console.error('[online] confirmReady failed:', e);
      setReadyConfirmed(false);
      // Refund if the ready confirmation itself failed after deduction
      if (user && bothLoggedIn) {
        awardCoins(user.uid, ONLINE_FEE).catch(console.error);
      }
    }
  };

  const handleRematch = async () => {
    if (!myRole || !roomCode || !room) return;
    setRematchRequested(true);
    try {
      await requestRematch(roomCode, myRole, room.boardSize);
    } catch (e) {
      console.error('[online] requestRematch failed:', e);
      setRematchRequested(false);
    }
  };

  const getSquareSize = (size: number) => {
    const gap = screenWidth < 640 ? 2 : screenWidth < 1024 ? 5 : 6;
    const padding = screenWidth < 640 ? 8 : 16;
    if (screenWidth < 640) {
      const parentChrome = 32 + 24 + 4;
      return Math.max(
        Math.floor((screenWidth - parentChrome - padding * 2 - (size - 1) * gap) / size),
        20,
      );
    }
    if (screenWidth < 1024) return size === 3 ? 85 : size === 4 ? 68 : size === 5 ? 55 : 45;
    return size === 3 ? 100 : size === 4 ? 80 : size === 5 ? 65 : 55;
  };

  // ─── NOT CONFIGURED ──────────────────────────────────────────────────────────
  if (!isFirebaseConfigured) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-white/8 p-8 text-center">
        <div className="text-3xl mb-3">🔌</div>
        <h3 className="text-white font-bold text-lg mb-2">Firebase not configured</h3>
        <p className="text-slate-400 text-sm">Set VITE_FIREBASE_* variables in .env to enable online play.</p>
      </div>
    );
  }

  // ─── LOBBY ───────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-white/10 shadow-2xl overflow-hidden">

          {/* Hero header */}
          <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Background decorative XO */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              <span className="absolute -top-4 -left-3 text-8xl font-black text-violet-500/8 rotate-[-15deg]">X</span>
              <span className="absolute -bottom-2 -right-2 text-8xl font-black text-fuchsia-500/8 rotate-[12deg]">O</span>
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Live Online</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Challenge a Real Player</h2>
              <p className="text-sm text-slate-400">
                Playing as <span className="text-violet-300 font-semibold">{getPlayerName()}</span>
              </p>
            </div>
          </div>

          <div className="px-5 pb-6 space-y-5">
            {/* Board size picker */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2.5 text-center">Grid Size</p>
              <div className="flex gap-2">
                {BOARD_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setBoardSize(s)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      boardSize === s
                        ? 'bg-gradient-to-b from-violet-600 to-fuchsia-700 text-white shadow-lg shadow-violet-500/30 scale-[1.04]'
                        : 'bg-white/5 border border-white/8 text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    {/* Mini grid preview */}
                    <span className={`grid gap-[2px]`} style={{ gridTemplateColumns: `repeat(${s}, 1fr)` }}>
                      {Array.from({ length: s * s }).map((_, i) => (
                        <span
                          key={i}
                          className={`block rounded-[1px] ${boardSize === s ? 'bg-white/60' : 'bg-slate-600'}`}
                          style={{ width: 4, height: 4 }}
                        />
                      ))}
                    </span>
                    <span>{s}×{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Match — primary CTA */}
            <button
              onClick={handleFindRandom}
              className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <span className="relative flex items-center justify-center gap-2.5">
                <span className="text-xl">⚡</span>
                Quick Match
                <span className="text-sm font-semibold opacity-75">— find anyone online</span>
              </span>
            </button>

            {/* Friend play — divider + two cards side by side */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">or play with a friend</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Create Room */}
                <button
                  onClick={handleCreateRoom}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-500/8 border border-sky-500/20 hover:bg-sky-500/15 hover:border-sky-400/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">🏠</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Create Room</p>
                    <p className="text-xs text-slate-500 mt-0.5">Get an invite code</p>
                  </div>
                </button>

                {/* Join Room */}
                <button
                  onClick={() => { setShowJoinInput((v) => !v); setError(null); }}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    showJoinInput
                      ? 'bg-violet-500/15 border-violet-400/40'
                      : 'bg-violet-500/8 border-violet-500/20 hover:bg-violet-500/15 hover:border-violet-400/40'
                  }`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">🔑</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Join Room</p>
                    <p className="text-xs text-slate-500 mt-0.5">Enter invite code</p>
                  </div>
                </button>
              </div>

              {/* Join input — expands below when Join Room is clicked */}
              {showJoinInput && (
                <div className="mt-3 rounded-xl bg-slate-800/80 border border-violet-400/25 p-4 space-y-3">
                  <p className="text-xs text-slate-400 text-center">Type the 5-digit code your friend shared</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="· · · · ·"
                      value={joinCode}
                      autoFocus
                      onChange={(e) => { setJoinCode(e.target.value.replace(/\D/g, '')); setError(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                      className="flex-1 px-3 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-center text-2xl font-black tracking-[0.4em] placeholder:text-slate-700 placeholder:tracking-widest focus:outline-none focus:border-violet-400 transition-colors"
                    />
                    <button
                      onClick={handleJoinByCode}
                      disabled={joinCode.length !== 5}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-35 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                    >
                      Join
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guest rate-limit notice */}
            {isGuest && (
              <div className="rounded-xl bg-slate-800/60 border border-white/8 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Guest: <span className="text-white font-bold">{guestRemaining}</span>/{GUEST_LIMIT} free games this hour
                </span>
                <span className="text-violet-300 font-semibold shrink-0">Sign in for unlimited + coins</span>
              </div>
            )}

            {/* Logged-in coin stake notice */}
            {!isGuest && (
              <div className="rounded-xl bg-amber-500/8 border border-amber-400/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-300 font-semibold">
                  🪙 {ONLINE_FEE} entry · 🏆 {ONLINE_PRIZE} prize
                </span>
                <span className="text-slate-500 shrink-0">vs logged-in players only</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-white/10 shadow-2xl p-14 flex flex-col items-center gap-5">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/15" />
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-[-8px] rounded-full border-2 border-fuchsia-500/10 border-b-fuchsia-400/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {isSearching ? '⚡' : '🎮'}
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-lg">{isSearching ? searchMsg : 'Setting up your room…'}</p>
          {isSearching && waitElapsed > 3 && (
            <p className="text-xs text-slate-500 mt-1">Hang tight, this can take a moment</p>
          )}
        </div>
      </div>
    );
  }

  // ─── READY CHECK (both players confirm before game starts) ───────────────────
  if (phase === 'readycheck' && room) {
    const p1Ready = room.ready?.player1 ?? false;
    const p2Ready = room.ready?.player2 ?? false;
    const myReady = myRole === 'player1' ? p1Ready : p2Ready;
    const opReady = myRole === 'player1' ? p2Ready : p1Ready;
    const opName = (myRole === 'player1' ? room.player2?.name : room.player1?.name) ?? 'Opponent';

    return (
      <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-violet-400/30 shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="px-6 py-8 flex flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">Match Found</span>
          </div>

          <h2 className="text-xl font-black text-white">Both players confirm to start</h2>

          {/* Player cards side by side */}
          <div className="w-full flex items-stretch gap-3">
            {/* Player 1 — X */}
            <div className={`flex-1 flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-300 ${
              p1Ready
                ? 'bg-emerald-500/15 border-emerald-400/50 shadow-md shadow-emerald-500/15'
                : 'bg-sky-500/8 border-sky-400/25'
            }`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/40 to-blue-600/30 border border-sky-400/50 flex items-center justify-center text-sky-300 font-black text-xl shadow-lg">
                X
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white truncate max-w-[100px]">{room.player1?.name ?? 'Player 1'}</p>
                {myRole === 'player1' && <p className="text-[10px] text-violet-300 font-bold">You</p>}
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                p1Ready
                  ? 'bg-emerald-500/25 text-emerald-300'
                  : 'bg-white/5 text-slate-500'
              }`}>
                {p1Ready ? '✓ Ready' : 'Waiting…'}
              </div>
            </div>

            <div className="flex items-center justify-center shrink-0 text-slate-600 font-black text-sm">VS</div>

            {/* Player 2 — O */}
            <div className={`flex-1 flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-300 ${
              p2Ready
                ? 'bg-emerald-500/15 border-emerald-400/50 shadow-md shadow-emerald-500/15'
                : 'bg-rose-500/8 border-rose-400/25'
            }`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/40 to-pink-600/30 border border-rose-400/50 flex items-center justify-center text-rose-300 font-black text-xl shadow-lg">
                O
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white truncate max-w-[100px]">{room.player2?.name ?? 'Player 2'}</p>
                {myRole === 'player2' && <p className="text-[10px] text-violet-300 font-bold">You</p>}
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                p2Ready
                  ? 'bg-emerald-500/25 text-emerald-300'
                  : 'bg-white/5 text-slate-500'
              }`}>
                {p2Ready ? '✓ Ready' : 'Waiting…'}
              </div>
            </div>
          </div>

          {opReady && !myReady && (
            <p className="text-xs text-emerald-400 font-semibold animate-pulse">
              {opName} is ready — your turn to confirm!
            </p>
          )}

          {/* Coin stake notice */}
          {bothLoggedIn && (
            <div className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400/25 text-xs text-amber-300 text-center font-semibold">
              🪙 {ONLINE_FEE} entry fee · Winner takes 🏆 {ONLINE_PRIZE} · Draw refunds {ONLINE_DRAW_REFUND}
            </div>
          )}
          {coinError && (
            <div className="w-full px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 text-center">
              {coinError}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { cancelWaitingRoom(roomCode).catch(console.error); resetToLobby(); }}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              Leave
            </button>
            <button
              onClick={handleReady}
              disabled={readyConfirmed}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                readyConfirmed
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {readyConfirmed ? '✓ Ready!' : "I'm Ready"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── WAITING FOR OPPONENT ────────────────────────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-violet-400/25 shadow-2xl overflow-hidden">

        {/* Pulse glow at top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="px-6 py-8 flex flex-col items-center gap-6 text-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              {isSearching ? 'Searching for opponent…' : 'Room Open — Waiting for Challenger'}
            </span>
          </div>

          {/* Invite code card */}
          {!isSearching && (
            <div className="w-full max-w-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Share this invite code</p>
              <div className="relative rounded-2xl bg-slate-900/80 border border-violet-400/30 px-6 py-5 shadow-lg shadow-violet-500/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
                <span className="relative text-5xl font-black text-white tracking-[0.35em] tabular-nums select-all">
                  {roomCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-white/8 border border-white/15 text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {copied ? (
                  <><span>✓</span> Copied to clipboard!</>
                ) : (
                  <><span>📋</span> Copy Code</>
                )}
              </button>
            </div>
          )}

          {/* Animated waiting illustration */}
          <div className="flex items-center gap-6 py-2">
            {/* Me */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500/30 to-blue-600/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-black text-xl shadow-lg shadow-sky-500/15">
                X
              </div>
              <span className="text-xs font-semibold text-sky-300">You</span>
            </div>

            {/* VS + pulsing dots */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-slate-500 font-black text-sm">VS</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Opponent slot */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-slate-800/60 border border-dashed border-slate-600 flex items-center justify-center text-slate-600 animate-pulse">
                <span className="text-2xl">?</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">Opponent</span>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            {isSearching
              ? 'Looking for a live opponent in the arena…'
              : 'Send the code to a friend — the game starts instantly when they join.'}
          </p>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
          >
            Cancel
          </button>
        </div>

        {showLeaveConfirm && (
          <LeaveConfirm onStay={() => setShowLeaveConfirm(false)} onLeave={handleLeave} />
        )}
      </div>
    );
  }

  // ─── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    if (!room) {
      return (
        <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-white/10 shadow-2xl p-12 flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🎮</div>
          </div>
          <p className="text-white font-bold">Joining game…</p>
          <button
            onClick={resetToLobby}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      );
    }

    const mySymbol = myRole === 'player1' ? 'X' : 'O';
    const opponentSymbol = myRole === 'player1' ? 'O' : 'X';
    const isMyTurn =
      (mySymbol === 'X' && room.isXNext) ||
      (mySymbol === 'O' && !room.isXNext);
    const opponent = myRole === 'player1' ? room.player2 : room.player1;
    const opponentName = opponent?.name ?? 'Opponent';
    const currentSymbol = room.isXNext ? 'X' : 'O';
    const winnerSymbol = room.winner;
    const iWon = winnerSymbol === mySymbol;

    const size = room.boardSize;
    const gap = screenWidth < 640 ? 2 : screenWidth < 1024 ? 5 : 6;
    const padding = screenWidth < 640 ? 8 : 16;
    const squareSize = getSquareSize(size);

    const scoreCardClass = (symbol: 'X' | 'O') => {
      const isWinner = room.gameOver && room.winner === symbol;
      const isLoser = room.gameOver && room.winner !== symbol && room.winner !== 'draw';
      const isActive = !room.gameOver && currentSymbol === symbol;
      if (isWinner) {
        return symbol === 'X'
          ? 'bg-sky-500/15 border-sky-500/50 ring-1 ring-sky-500/20 animate-bounce-in'
          : 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/20 animate-bounce-in';
      }
      if (isLoser) return 'bg-slate-800/30 border-slate-700/40 opacity-50';
      if (isActive) {
        return symbol === 'X'
          ? 'bg-sky-500/10 border-sky-500/40'
          : 'bg-rose-500/10 border-rose-500/40';
      }
      return 'bg-slate-800/50 border-white/8';
    };

    return (
      <div className="space-y-3 sm:space-y-4">
        <Confetti trigger={room.gameOver && iWon} />

        {/* Result overlays — same style as local play */}
        {showWinNotice && room.gameOver && (iWon || winnerSymbol === 'draw') && (
          <WinAnimation
            winner={winnerSymbol === 'draw' ? 'draw' : mySymbol}
            playerName={iWon ? getPlayerName() : 'Both Players'}
            onClose={() => setShowWinNotice(false)}
            isDraw={winnerSymbol === 'draw'}
            coinDelta={coinDelta}
          />
        )}
        {showLossNotice && room.gameOver && winnerSymbol !== 'draw' && !iWon && (
          <LossAnimation
            show={true}
            playerName="You Lost!"
            isPlayerWin={false}
            onClose={() => setShowLossNotice(false)}
            coinDelta={coinDelta}
          />
        )}

        <div className={`relative rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 ${
          room.gameOver && winnerSymbol !== 'draw'
            ? 'bg-slate-900/90 border-yellow-500/40 shadow-yellow-500/20'
            : 'bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-violet-400/35 shadow-lg shadow-violet-500/20'
        }`}>
          <div className={`absolute top-0 left-0 right-0 h-px ${
            room.gameOver && winnerSymbol !== 'draw'
              ? 'bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-violet-400/50 to-transparent'
          }`} />

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · {size}×{size} · #{roomCode}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-black shadow-md ${
              mySymbol === 'X'
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-sky-500/20'
                : 'bg-rose-500/20 border-rose-400/60 text-rose-300 shadow-rose-500/20'
            }`}>
              <span className="text-xs">You</span>
              <span className={`text-lg leading-none ${mySymbol === 'X' ? 'text-sky-400' : 'text-rose-400'}`}>{mySymbol}</span>
            </div>
          </div>

          {moveError && (
            <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300 text-center">
              {moveError}
            </div>
          )}

          {/* Status */}
          <div className="text-center px-4 sm:px-6 pt-3 pb-4 border-b border-white/5">
            <h2 className={`text-xl sm:text-2xl font-black text-white ${room.gameOver ? 'animate-bounce-in' : ''}`}>
              {room.gameOver ? (
                winnerSymbol === 'draw' ? "It's a Draw! 🤝"
                  : iWon ? 'You Win! 🎉'
                  : `${opponentName} Wins!`
              ) : isMyTurn ? (
                <span>
                  <span className="text-violet-300">Your turn</span>
                  <span className="text-slate-400 font-semibold text-base ml-2">({mySymbol})</span>
                </span>
              ) : (
                <span>
                  <span className={opponentSymbol === 'X' ? 'text-sky-400' : 'text-rose-400'}>{opponentName}</span>
                  <span className="text-slate-400 font-semibold">'s turn…</span>
                </span>
              )}
            </h2>

            {room.gameOver && (
              <div className="mt-2">
                <button
                  onClick={() => setShowRematchDialog(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-150 underline underline-offset-2"
                >
                  View options
                </button>
              </div>
            )}

            {!room.gameOver && (
              <div className="mt-3 max-w-[200px] mx-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    {isMyTurn ? 'Your time' : 'Their time'}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                    {timeLeft}s
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 5
                        ? 'bg-gradient-to-r from-red-500 to-rose-500'
                        : timeLeft <= 10
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Player name bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
            <div className={`flex items-center gap-2 transition-all duration-200 ${currentSymbol === 'X' && !room.gameOver ? 'opacity-100' : 'opacity-50'}`}>
              <span className="text-sky-400 font-black text-lg">X</span>
              <span className="text-sm font-semibold text-white truncate max-w-[100px]">{room.player1?.name ?? 'Player 1'}</span>
              {mySymbol === 'X' && <span className="text-[10px] text-violet-300 font-bold">(You)</span>}
            </div>
            <span className="text-slate-500 text-xs font-bold">VS</span>
            <div className={`flex items-center gap-2 flex-row-reverse transition-all duration-200 ${currentSymbol === 'O' && !room.gameOver ? 'opacity-100' : 'opacity-50'}`}>
              <span className="text-rose-400 font-black text-lg">O</span>
              <span className="text-sm font-semibold text-white truncate max-w-[100px]">
                {room.player2?.name ?? <span className="text-slate-500 italic text-xs">Waiting…</span>}
              </span>
              {mySymbol === 'O' && <span className="text-[10px] text-violet-300 font-bold">(You)</span>}
            </div>
          </div>

          {/* Board */}
          <div className="relative py-6 sm:py-8 w-full flex justify-center overflow-hidden px-3 sm:px-4">
            <div className={`absolute inset-4 rounded-3xl transition-all duration-500 blur-3xl pointer-events-none ${
              room.gameOver && winnerSymbol === mySymbol ? 'bg-sky-400/25' :
              room.gameOver && winnerSymbol === opponentSymbol ? 'bg-rose-400/25' :
              room.gameOver ? 'bg-slate-400/15' :
              isMyTurn ? 'bg-violet-500/20' : 'bg-slate-500/10'
            }`} />
            <div
              className="relative rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(30,20,60,0.6) 50%, rgba(139,92,246,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(139,92,246,0.3), 0 12px 40px rgba(109,40,217,0.2)',
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, ${squareSize}px)`,
                gap: `${gap}px`,
                padding: `${padding}px`,
                boxSizing: 'content-box',
              }}
            >
              {room.board.map((value, index) => {
                const isWinning = room.winningLine?.includes(index);
                const canClick = !room.gameOver && value === null && isMyTurn;
                return (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={!canClick}
                    style={{ width: `${squareSize}px`, height: `${squareSize}px`, fontSize: `${squareSize * 0.5}px`, boxSizing: 'border-box' }}
                    className={`rounded-xl font-black transition-all duration-150 flex items-center justify-center relative overflow-hidden
                      ${value === 'X' ? 'bg-gradient-to-br from-sky-400/40 to-sky-600/25 text-sky-200 border border-sky-400/60 shadow-lg shadow-sky-400/30'
                        : value === 'O' ? 'bg-gradient-to-br from-rose-400/40 to-rose-600/25 text-rose-200 border border-rose-400/60 shadow-lg shadow-rose-400/30'
                        : canClick ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/15 hover:from-violet-400/25 hover:to-fuchsia-400/15 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-400/25 cursor-pointer'
                        : 'bg-gradient-to-br from-white/5 to-white/3 border border-white/8 cursor-not-allowed'}
                      ${isWinning ? 'ring-2 ring-yellow-400/80 bg-gradient-to-br from-yellow-400/40 to-amber-500/25 border-yellow-400/60 shadow-xl shadow-yellow-400/35 scale-105' : ''}
                      active:scale-95 hover:scale-105 disabled:hover:scale-100
                    `}
                  >
                    {!value && !isWinning && canClick && (
                      <span className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
                    )}
                    <span className={`relative drop-shadow-md ${isWinning && room.gameOver ? 'text-yellow-200 drop-shadow-lg' : ''}`}>
                      {value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {!room.gameOver && (
            <div className="pb-4 text-center">
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300 transition-all duration-200"
              >
                🚪 Forfeit
              </button>
            </div>
          )}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-3">
          {(['X', 'O'] as const).map((symbol) => {
            const isP1 = symbol === 'X';
            const player = isP1 ? room.player1 : room.player2;
            const isMe = mySymbol === symbol;
            const name = player?.name ?? (isMe ? getPlayerName() : 'Opponent');
            return (
              <div
                key={symbol}
                className={`rounded-xl p-3 sm:p-4 border transition-all duration-300 ${scoreCardClass(symbol)}`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1 min-w-0 flex-1">
                    <span className="truncate">{name}</span>
                    {isMe && <span className="text-[9px] text-violet-300 font-bold shrink-0">(You)</span>}
                  </p>
                  <span className={`font-black text-base sm:text-xl shrink-0 ${symbol === 'X' ? 'text-sky-400' : 'text-rose-400'}`}>
                    {symbol}
                  </span>
                </div>
                {room.gameOver && (
                  <p className="text-xs font-bold mt-1">
                    {room.winner === symbol ? <span className="text-yellow-400">Winner 🏆</span>
                      : room.winner === 'draw' ? <span className="text-slate-400">Draw 🤝</span>
                      : <span className="text-slate-500">Lost</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {showRematchDialog && room.gameOver && (() => {
          const opponentRole = myRole === 'player1' ? 'player2' : 'player1';
          const opponentWantsRematch = room.rematch?.[opponentRole] ?? false;
          return (
            <RematchDialog
              result={winnerSymbol === 'draw' ? 'draw' : iWon ? 'win' : 'loss'}
              opponentName={opponentName}
              rematchRequested={rematchRequested}
              opponentWantsRematch={opponentWantsRematch}
              onRematch={handleRematch}
              onLeave={() => { setShowRematchDialog(false); resetToLobby(); }}
              onDismiss={() => setShowRematchDialog(false)}
            />
          );
        })()}

        {showLeaveConfirm && (
          <LeaveConfirm onStay={() => setShowLeaveConfirm(false)} onLeave={handleLeave} isPlaying />
        )}
      </div>
    );
  }

  return null;
}

function LeaveConfirm({
  onStay,
  onLeave,
  isPlaying = false,
}: {
  onStay: () => void;
  onLeave: () => void;
  isPlaying?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onStay}
    >
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-red-500/40 shadow-2xl max-w-sm w-full p-6 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🚪</div>
          <h3 className="text-lg font-black text-white mb-1.5">
            {isPlaying ? 'Forfeit game?' : 'Cancel search?'}
          </h3>
          <p className="text-sm text-slate-400">
            {isPlaying
              ? 'Leaving now counts as a forfeit. Your opponent wins.'
              : 'The room will be closed.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all duration-200 font-semibold text-sm"
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-500/30 transition-all duration-200"
          >
            {isPlaying ? 'Forfeit' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RematchDialog({
  result,
  opponentName,
  rematchRequested,
  opponentWantsRematch,
  onRematch,
  onLeave,
  onDismiss,
}: {
  result: 'win' | 'loss' | 'draw';
  opponentName: string;
  rematchRequested: boolean;
  opponentWantsRematch: boolean;
  onRematch: () => void;
  onLeave: () => void;
  onDismiss: () => void;
}) {
  const resultConfig = {
    win:  { icon: '🏆', label: 'You Won!',    color: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/40', text: 'text-yellow-300' },
    loss: { icon: '😔', label: 'You Lost',    color: 'from-slate-700/60 to-slate-800/60',  border: 'border-slate-600/40',  text: 'text-slate-300'  },
    draw: { icon: '🤝', label: "It's a Draw!", color: 'from-cyan-500/20 to-blue-600/10',    border: 'border-cyan-500/40',   text: 'text-cyan-300'   },
  }[result];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onDismiss}
    >
      <div
        className={`relative bg-gradient-to-b ${resultConfig.color} border ${resultConfig.border} rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-bounce-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {/* Result */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{resultConfig.icon}</div>
          <h3 className={`text-2xl font-black ${resultConfig.text}`}>{resultConfig.label}</h3>
          <p className="text-sm text-slate-400 mt-1">vs {opponentName}</p>
        </div>

        {/* Rematch status message */}
        {opponentWantsRematch && !rematchRequested && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            {opponentName} wants a rematch!
          </div>
        )}

        {rematchRequested && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold">
            <span className="w-3 h-3 rounded-full border-2 border-amber-300/50 border-t-amber-300 animate-spin shrink-0" />
            Waiting for {opponentName}…
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRematch}
            disabled={rematchRequested}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              rematchRequested
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-default'
                : opponentWantsRematch
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {rematchRequested ? 'Rematch requested…' : '🔄 Rematch'}
          </button>
          <button
            onClick={onLeave}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

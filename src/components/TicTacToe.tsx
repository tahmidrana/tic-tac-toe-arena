import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../store/authStore';
import { Confetti } from './Confetti';
import { WinAnimation } from './WinAnimation';
import { LossAnimation } from './LossAnimation';
import { GameModeSelector } from './GameModeSelector';
import { SettingsModal } from './SettingsModal';
import { type BoardSize } from './BoardSizeSelector';
import { AIPlayer, Difficulty } from '../utils/aiPlayer';
import { calculateWinner } from '../utils/winLogic';
import { deductCoins, awardCoins, AI_CONFIG } from '../utils/coinService';


export function TicTacToe() {
  const { user } = useAuth();
  const { users, recordWin, recordLoss, recordDraw, renameUser } = useGameStore();
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [aiThinking, setAiThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinNotice, setShowWinNotice] = useState(true);
  const [showLossNotice, setShowLossNotice] = useState(true);
  const TURN_SECONDS = 15;
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoserName, setLeaveLoserName] = useState<string | null>(null);
  const [coinError, setCoinError] = useState<string | null>(null);
  // Game is idle (board disabled) until the user explicitly starts a game.
  const [gameStarted, setGameStarted] = useState(false);
  // Portal target in the right column for player stats.
  const [statsSlot, setStatsSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setStatsSlot(document.getElementById('player-stats-slot'));
  }, []);

  const player1 = users[0] || { id: '1', name: 'Player 1', wins: 0, losses: 0, draws: 0 };
  const player2 = users[1] || { id: '2', name: 'Random Player', wins: 0, losses: 0, draws: 0 };

  const isBoardFull = (squares: (string | null)[]): boolean => {
    return squares.every((square) => square !== null);
  };

  const makeAIMove = (currentBoard: (string | null)[]) => {
    setAiThinking(true);
    setTimeout(() => {
    const ai = new AIPlayer(difficulty, boardSize);
    const moveIndex = ai.getMove(currentBoard);

    const newBoard = [...currentBoard];
    newBoard[moveIndex] = 'O';

    const { winner: gameWinner, line } = calculateWinner(newBoard, boardSize);
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      setGameOver(true);
      if (gameWinner === 'X') {
        recordWin(player1.id);
        recordLoss(player2.id);
      } else {
        recordWin(player2.id);
        recordLoss(player1.id);
      }
      setAiThinking(false);
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner('draw');
      recordDraw([player1.id, player2.id]);
      // Refund entry fee on draw vs AI
      if (user) {
        const cfg = AI_CONFIG[difficulty];
        if (cfg) awardCoins(user.uid, cfg.drawRefund).catch(console.error);
      }
      setAiThinking(false);
      return;
    }

    setBoard(newBoard);
    setIsXNext(true);
    setAiThinking(false);
    }, 1000);
  };

  const handleClick = (index: number) => {
    if (!gameStarted || gameOver || board[index] !== null || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X'; // Player is always X
    setBoard(newBoard);

    const { winner: gameWinner, line } = calculateWinner(newBoard, boardSize);
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      setGameOver(true);
      recordWin(player1.id);
      recordLoss(player2.id);
      // Award coin prize when logged-in player beats AI
      if (user && gameMode === 'ai') {
        const cfg = AI_CONFIG[difficulty];
        if (cfg) awardCoins(user.uid, cfg.prize).catch(console.error);
      }
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner('draw');
      recordDraw([player1.id, player2.id]);
      // Refund entry fee on draw vs AI
      if (user && gameMode === 'ai') {
        const cfg = AI_CONFIG[difficulty];
        if (cfg) awardCoins(user.uid, cfg.drawRefund).catch(console.error);
      }
      return;
    }

    // If playing against AI, let AI make its move
    if (gameMode === 'ai') {
      setIsXNext(false);
      makeAIMove(newBoard);
    } else {
      // PvP mode: alternate turns
      setIsXNext(!isXNext);
    }
  };

  const handleClickPvP = (index: number) => {
    if (gameMode === 'ai') return; // Use AI handler instead

    if (!gameStarted || gameOver || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const { winner: gameWinner, line } = calculateWinner(newBoard, boardSize);
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      setGameOver(true);
      // Record win/loss
      if (gameWinner === 'X') {
        recordWin(player1.id);
        recordLoss(player2.id);
      } else {
        recordWin(player2.id);
        recordLoss(player1.id);
      }
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner('draw');
      recordDraw([player1.id, player2.id]);
      return;
    }

    setIsXNext(!isXNext);
  };

  const requestReset = () => {
    // Always confirm before (re)starting a game.
    setShowResetConfirm(true);
  };

  const leaveGame = () => {
    setShowLeaveConfirm(false);
    // Record loss for the leaving player (current turn holder), win for opponent.
    if (!gameOver) {
      const leavingPlayer = isXNext ? player1 : player2;
      const winningPlayer = isXNext ? player2 : player1;
      recordLoss(leavingPlayer.id);
      recordWin(winningPlayer.id);
      setLeaveLoserName(leavingPlayer.name);
    }
    resetGame();
    setGameStarted(false);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    setCoinError(null);

    if (user && gameMode === 'ai') {
      const cfg = AI_CONFIG[difficulty];
      if (cfg) {
        const result = await deductCoins(user.uid, cfg.fee);
        if (result === 'insufficient') {
          setCoinError(`Not enough coins — you need ${cfg.fee} 🪙 to play on ${difficulty} difficulty.`);
          return;
        }
      }
    }

    resetGame();
    if (gameMode === 'ai') {
      renameUser(player2.id, 'AI');
    }
    setGameStarted(true);
  };

  const resetGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinner(null);
    setWinningLine(null);
    setAiThinking(false);
    setShowWinNotice(true);
    setShowLossNotice(true);
  };

  const handleGameModeChange = (mode: 'pvp' | 'ai') => {
    setGameMode(mode);
    resetGame();
    setGameStarted(false); // mode change should NOT auto-start a game
    // Update player 2 name based on mode
    if (mode === 'ai') {
      renameUser(player2.id, 'AI');
    } else {
      renameUser(player2.id, 'Player 2');
    }
  };

  const handleBoardSizeChange = (newSize: BoardSize) => {
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinner(null);
    setWinningLine(null);
    setGameStarted(false); // board size change should NOT auto-start a game
  };

  const handleRename = (playerId: string) => {
    if (editName.trim()) {
      renameUser(playerId, editName.trim());
      setEditingPlayer(null);
      setEditName('');
    }
  };

  const currentPlayer = isXNext ? 'X' : 'O';
  const currentPlayerObj = currentPlayer === 'X' ? player1 : player2;
  const winnerPlayer = winner === 'X' ? player1 : winner === 'O' ? player2 : null;
  const boardClickHandler = gameMode === 'ai' ? handleClick : handleClickPvP;

  // Track viewport width so the board re-fits on resize / orientation change
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset the turn timer whenever the active turn changes
  // (board change = a move was just made; mode/end-of-game also resets).
  useEffect(() => {
    setTimeLeft(TURN_SECONDS);
  }, [board, gameMode, gameOver]);

  // Timer runs for both players (humans and the simulated random opponent).
  // In AI mode, the opponent moves well within the 15s window thanks to
  // randomThinkMs(), so the human-only auto-play branch below stays correct.
  const timerActive =
    gameStarted &&
    !gameOver &&
    !showSettings;

  // Countdown + auto-play random on timeout.
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft <= 0) {
      // Don't auto-play for the opponent — they'll move via their own
      // setTimeout (which always fires before 15s). Only humans time out.
      const isOpponentTurn = gameMode === 'ai' && !isXNext;
      if (isOpponentTurn) return;

      const empties: number[] = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) empties.push(i);
      }
      if (empties.length === 0) return;
      const randomIdx = empties[Math.floor(Math.random() * empties.length)];
      if (gameMode === 'ai') handleClick(randomIdx);
      else handleClickPvP(randomIdx);
      return;
    }

    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // handleClick / handleClickPvP are intentionally omitted — their closure
    // is fresh on each render and they aren't called until timeLeft hits 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, timerActive]);

  // Calculate responsive board dimensions - Full width on mobile without overflow
  const getSquareSize = () => {
    const gap = screenWidth < 640 ? 2 : screenWidth < 1024 ? 5 : 6;
    const padding = screenWidth < 640 ? 8 : 16;

    // Mobile: make board fit exactly within viewport
    if (screenWidth < 640) {
      // Horizontal chrome around the grid on mobile:
      //   <main> px-4       = 16px * 2 = 32
      //   board wrapper px-3 = 12px * 2 = 24
      // Plus a 4px safety buffer.
      const parentChrome = 32 + 24 + 4;
      const totalGapWidth = (boardSize - 1) * gap;
      const totalPaddingWidth = padding * 2;
      const availableWidth = screenWidth - parentChrome - totalPaddingWidth - totalGapWidth;
      const size = Math.floor(availableWidth / boardSize);
      return Math.max(size, 20); // Minimum 20px per square
    }
    // Tablet: 640px - 1024px
    else if (screenWidth < 1024) {
      return boardSize === 3 ? 85 : boardSize === 4 ? 68 : boardSize === 5 ? 55 : 45;
    }
    // Desktop: > 1024px
    else {
      return boardSize === 3 ? 100 : boardSize === 4 ? 80 : boardSize === 5 ? 65 : 55;
    }
  };

  const gap = screenWidth < 640 ? 2 : screenWidth < 1024 ? 5 : 6;
  const padding = screenWidth < 640 ? 8 : 16;
  const squareSize = getSquareSize();


  // Coin delta for AI mode (only for logged-in users)
  const aiCfg = AI_CONFIG[difficulty];
  const aiCoinDelta = user && gameMode === 'ai' && aiCfg
    ? winner === 'X'     ? aiCfg.prize
    : winner === 'draw'  ? aiCfg.drawRefund
    : winner === 'O'     ? -aiCfg.fee
    : undefined
    : undefined;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Animations */}
      <Confetti trigger={gameOver && winner !== 'draw' && winner !== null} />
      {/* Win/Draw Animations - PvP: show winner, PvAI: show player result/draw */}
      {showWinNotice && gameMode === 'pvp' && winner !== 'draw' && (
        <WinAnimation
          winner={winner}
          playerName={winnerPlayer?.name || 'Players'}
          onClose={() => setShowWinNotice(false)}
          isDraw={false}
        />
      )}
      {showWinNotice && gameMode === 'pvp' && winner === 'draw' && (
        <WinAnimation
          winner={winner}
          playerName="Both Players"
          onClose={() => setShowWinNotice(false)}
          isDraw={true}
        />
      )}

      {/* AI Mode: Show player result or draw */}
      {showWinNotice && gameMode === 'ai' && winner === 'draw' && (
        <WinAnimation
          winner={winner}
          playerName="You"
          onClose={() => setShowWinNotice(false)}
          isDraw={true}
          coinDelta={aiCoinDelta}
        />
      )}
      {showLossNotice && gameMode === 'ai' && winner !== null && winner !== 'draw' && (
        <LossAnimation
          show={gameOver && winner !== null && winner !== 'draw'}
          playerName={winner === 'X' ? 'You Won!' : 'You Lost!'}
          isPlayerWin={winner === 'X'}
          onClose={() => setShowLossNotice(false)}
          coinDelta={aiCoinDelta}
        />
      )}

      {/* Left-game loss notification */}
      <LossAnimation
        show={leaveLoserName !== null}
        playerName={`${leaveLoserName} forfeited`}
        isPlayerWin={false}
        onClose={() => setLeaveLoserName(null)}
      />

      {/* Confetti only for PvP wins or AI player wins */}
      {gameMode === 'pvp' && (
        <Confetti trigger={gameOver && winner !== 'draw' && winner !== null} />
      )}
      {gameMode === 'ai' && winner === 'X' && (
        <Confetti trigger={gameOver && winner !== null} />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        boardSize={boardSize}
        onBoardSizeChange={handleBoardSizeChange}
        gameMode={gameMode}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        locked={gameStarted && !gameOver}
      />

      {/* Game Card */}
      <div
        className={`relative rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 ${
          gameOver && winner !== 'draw' && winner !== null
            ? 'bg-slate-900/90 border-yellow-500/40 shadow-yellow-500/20 animate-pulse-board'
            : gameStarted && !gameOver
            ? 'bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-violet-400/35 shadow-lg shadow-violet-500/20'
            : 'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-white/8'
        }`}
      >
        {/* Subtle top glow line */}
        <div className={`absolute top-0 left-0 right-0 h-px transition-all duration-500 ${
          gameOver && winner !== 'draw' && winner !== null
            ? 'bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent'
            : gameStarted && !gameOver
            ? 'bg-gradient-to-r from-transparent via-violet-400/50 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
        }`} />

        {/* Toolbar: mode toggle + settings — lives inside the card */}
        <div className="flex items-center gap-2 px-3 sm:px-4 pt-3 pb-3 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <GameModeSelector
              selectedMode={gameMode}
              onModeChange={handleGameModeChange}
              disabled={gameStarted && !gameOver}
            />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            disabled={gameStarted && !gameOver}
            className={`flex-shrink-0 h-10 w-10 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-slate-700/80 transition-all duration-200 flex items-center justify-center text-base ${gameStarted && !gameOver ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Coin error banner */}
        {coinError && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-center">
            {coinError}
          </div>
        )}

        {/* Status bar */}
        <div className="text-center px-4 sm:px-6 pt-5 pb-4 border-b border-white/5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            {boardSize}×{boardSize}
            {' · '}{boardSize === 3 ? '3 in a row' : '4 in a row'}
            {user && gameMode === 'ai' && !gameStarted && AI_CONFIG[difficulty] && (
              <span className="ml-2 text-amber-400 normal-case">· 🪙 {AI_CONFIG[difficulty].fee} entry</span>
            )}
          </div>
          <h2 className={`text-xl sm:text-2xl font-black text-white ${gameOver ? 'animate-bounce-in' : ''}`}>
            {!gameStarted ? (
              <span className="text-slate-400 text-base font-semibold">Ready to play?</span>
            ) : gameOver ? (
              winner === 'draw'
                ? "It's a Draw! 🤝"
                : `${winner === 'X' ? player1.name : player2.name} Wins! 🎉`
            ) : (
              <span>
                <span className={currentPlayer === 'X' ? 'text-sky-400' : 'text-rose-400'}>
                  {currentPlayerObj.name}
                </span>
                <span className="text-slate-400 font-semibold">'s turn</span>
              </span>
            )}
          </h2>

          {/* Play Again — shown right below result */}
          {gameOver && (
            <div className="mt-3">
              <button
                onClick={requestReset}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 animate-bounce-in transition-all duration-200 hover:scale-105"
              >
                🎮 Play Again
              </button>
            </div>
          )}

          {/* Turn timer + Leave Game */}
          {timerActive && (
            <div className="mt-3 max-w-[200px] mx-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Time
                </span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-300'
                  }`}
                >
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

          {/* Leave Game — below timer when game is active */}
          {gameStarted && !gameOver && (
            <div className="mt-3">
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300 transition-all duration-200"
              >
                <span>🚪</span> Leave Game
              </button>
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="relative py-6 sm:py-8 w-full flex justify-center overflow-hidden px-3 sm:px-4">
          {/* Start Game overlay */}
          {!gameStarted && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5"
              style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(15,15,30,0.75) 70%)' }}
            >
              {/* Decorative ring */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute w-20 h-20 rounded-full border border-violet-400/30" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600/40 to-fuchsia-600/30 flex items-center justify-center text-2xl shadow-xl shadow-violet-500/30">
                  🎮
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-lg tracking-tight">Ready to Play?</p>
                <p className="text-xs text-slate-400 mt-1">
                  {gameMode === 'ai' ? 'You vs 🤖 AI opponent' : 'Two players on this device'}
                </p>
              </div>
              <button
                onClick={requestReset}
                className="px-8 py-2.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-xl shadow-violet-500/40 transition-all duration-200 hover:scale-105 border border-violet-400/30"
              >
                Start Game
              </button>
            </div>
          )}
          {/* Board glow backdrop */}
          <div className={`absolute inset-4 rounded-3xl transition-all duration-500 blur-3xl pointer-events-none ${
            gameStarted && !gameOver ? 'bg-violet-500/20' :
            gameOver && winner === 'X' ? 'bg-sky-400/25' :
            gameOver && winner === 'O' ? 'bg-rose-400/25' :
            gameOver && winner === 'draw' ? 'bg-slate-400/15' : 'bg-transparent'
          }`} />
          <div
            className={`relative rounded-2xl transition-opacity duration-300 ${!gameStarted ? 'opacity-20' : ''}`}
            style={{
              background: gameStarted && !gameOver
                ? 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(30,20,60,0.6) 50%, rgba(139,92,246,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.2) 100%)',
              boxShadow: gameStarted && !gameOver
                ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(139,92,246,0.3), 0 12px 40px rgba(109,40,217,0.2)'
                : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.08)',
              display: 'grid',
              gridTemplateColumns: `repeat(${boardSize}, ${squareSize}px)`,
              gap: `${gap}px`,
              padding: `${padding}px`,
              boxSizing: 'content-box',
            }}
          >
            {board.map((value, index) => {
              const isWinningSquare = winningLine?.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => boardClickHandler(index)}
                  disabled={!gameStarted || gameOver || value !== null || aiThinking}
                  style={{
                    boxSizing: 'border-box',
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                    fontSize: `${squareSize * 0.5}px`,
                  }}
                  className={`rounded-xl font-black transition-all duration-150 flex items-center justify-center relative overflow-hidden
                    ${
                      value === 'X'
                        ? 'bg-gradient-to-br from-sky-400/40 to-sky-600/25 text-sky-200 border border-sky-400/60 animate-bounce-in shadow-lg shadow-sky-400/30'
                        : value === 'O'
                        ? 'bg-gradient-to-br from-rose-400/40 to-rose-600/25 text-rose-200 border border-rose-400/60 animate-bounce-in shadow-lg shadow-rose-400/30'
                        : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/15 hover:from-violet-400/25 hover:to-fuchsia-400/15 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-400/25 cursor-pointer'
                    }
                    ${isWinningSquare ? 'ring-2 ring-yellow-400/80 bg-gradient-to-br from-yellow-400/40 to-amber-500/25 border-yellow-400/60 shadow-xl shadow-yellow-400/35 scale-105' : ''}
                    disabled:cursor-not-allowed active:scale-95 hover:scale-105
                  `}
                >
                  {/* Inner shine */}
                  {!value && !isWinningSquare && (
                    <span className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
                  )}
                  <span className={`relative drop-shadow-md ${isWinningSquare && gameOver ? 'text-yellow-200 drop-shadow-lg' : ''}`}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Player Stats — portaled to the right column. Only shown when signed in.
          Opponent is only shown when a match is actually running (gameStarted). */}
      {statsSlot && user && createPortal(
        <div className={`grid gap-3 sm:gap-4 ${gameStarted ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Player 1 */}
          <div
            className={`rounded-xl p-3 sm:p-5 border transition-all duration-300 ${
              gameOver && winner === 'X'
                ? 'bg-sky-500/15 border-sky-500/50 ring-1 ring-sky-500/20 animate-bounce-in'
                : gameOver && winner === 'O'
                ? 'bg-slate-800/30 border-slate-700/40 opacity-50'
                : !gameOver && currentPlayer === 'X'
                ? 'bg-sky-500/10 border-sky-500/40'
                : 'bg-slate-800/50 border-white/8'
            }`}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="min-w-0 flex-1">
                {editingPlayer === player1.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(player1.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(player1.id);
                    }}
                    className="px-2 py-1 text-xs sm:text-sm rounded-lg bg-slate-700 text-white border border-sky-500/50 focus:outline-none focus:border-sky-400 w-full"
                  />
                ) : (
                  <h3
                    className="text-xs sm:text-base font-bold text-white cursor-pointer hover:text-sky-400 truncate transition-colors"
                    onClick={() => { setEditingPlayer(player1.id); setEditName(player1.name); }}
                    title="Click to rename"
                  >
                    {player1.name}
                  </h3>
                )}
              </div>
              <span className="text-lg sm:text-2xl font-black text-sky-400 flex-shrink-0">X</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="rounded-lg bg-green-500/10 py-1.5">
                <p className="text-xs sm:text-sm font-bold text-green-400">{player1.wins}</p>
                <p className="text-xs text-slate-500">W</p>
              </div>
              <div className="rounded-lg bg-red-500/10 py-1.5">
                <p className="text-xs sm:text-sm font-bold text-red-400">{player1.losses}</p>
                <p className="text-xs text-slate-500">L</p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 py-1.5">
                <p className="text-xs sm:text-sm font-bold text-yellow-400">{player1.draws}</p>
                <p className="text-xs text-slate-500">D</p>
              </div>
            </div>
          </div>

          {/* Player 2 — hidden until a match is actually running. */}
          {gameStarted && (
            <div
              className={`rounded-xl p-3 sm:p-5 border transition-all duration-300 ${
                gameOver && winner === 'O'
                  ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/20 animate-bounce-in'
                  : gameOver && winner === 'X'
                  ? 'bg-slate-800/30 border-slate-700/40 opacity-50'
                  : !gameOver && currentPlayer === 'O'
                  ? 'bg-rose-500/10 border-rose-500/40'
                  : 'bg-slate-800/50 border-white/8'
              }`}
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  {gameMode === 'ai' ? (
                    <h3 className="text-xs sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                      <span className="text-sm flex-shrink-0">🤖</span>
                      <span className="truncate">{player2.name}</span>
                      <span className="text-[10px] font-black text-violet-300 flex-shrink-0 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/30">AI</span>
                    </h3>
                  ) : editingPlayer === player2.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(player2.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(player2.id);
                      }}
                      className="px-2 py-1 text-xs sm:text-sm rounded-lg bg-slate-700 text-white border border-rose-500/50 focus:outline-none focus:border-rose-400 w-full"
                    />
                  ) : (
                    <h3
                      className="text-xs sm:text-base font-bold text-white cursor-pointer hover:text-rose-400 truncate transition-colors"
                      onClick={() => { setEditingPlayer(player2.id); setEditName(player2.name); }}
                      title="Click to rename"
                    >
                      {player2.name}
                    </h3>
                  )}
                </div>
                <span className="text-lg sm:text-2xl font-black text-rose-400 flex-shrink-0">O</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="rounded-lg bg-green-500/10 py-1.5">
                  <p className="text-xs sm:text-sm font-bold text-green-400">{player2.wins}</p>
                  <p className="text-xs text-slate-500">W</p>
                </div>
                <div className="rounded-lg bg-red-500/10 py-1.5">
                  <p className="text-xs sm:text-sm font-bold text-red-400">{player2.losses}</p>
                  <p className="text-xs text-slate-500">L</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 py-1.5">
                  <p className="text-xs sm:text-sm font-bold text-yellow-400">{player2.draws}</p>
                  <p className="text-xs text-slate-500">D</p>
                </div>
              </div>
            </div>
          )}
        </div>,
        statsSlot,
      )}

      {/* Leave Game confirmation */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-red-500/40 shadow-2xl max-w-sm w-full p-6 animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🚪</div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">Leave game?</h3>
              <p className="text-sm text-slate-400">Your current game progress will be lost.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all duration-200 font-semibold text-sm"
              >
                Stay
              </button>
              <button
                onClick={leaveGame}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-500/30 transition-all duration-200"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Game confirmation */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-violet-500/40 shadow-2xl max-w-sm w-full p-6 animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{!gameStarted || gameOver ? '🎮' : '⚠️'}</div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
                Start a new game?
              </h3>
              <p className="text-sm text-slate-400">
                {!gameStarted || gameOver
                  ? gameMode === 'ai'
                    ? 'A new AI opponent will be assigned.'
                    : 'Ready to play a fresh match?'
                  : 'Your current game progress will be lost.'}
              </p>
              {/* Coin fee notice for vs AI */}
              {user && gameMode === 'ai' && (() => {
                const cfg = AI_CONFIG[difficulty];
                if (!cfg) return null;
                const canAfford = (player1.coins ?? 0) >= cfg.fee;
                return (
                  <div className={`mt-3 flex items-center justify-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                    canAfford
                      ? 'bg-amber-500/10 border border-amber-400/25 text-amber-300'
                      : 'bg-red-500/10 border border-red-500/25 text-red-400'
                  }`}>
                    <span>🪙 {cfg.fee} entry · 🏆 {cfg.prize} win · 🤝 {cfg.drawRefund} draw</span>
                    <span className="text-slate-500">·</span>
                    <span>Balance: {(player1.coins ?? 0).toLocaleString()}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all duration-200 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={!!user && gameMode === 'ai' && !!AI_CONFIG[difficulty] && (player1.coins ?? 0) < AI_CONFIG[difficulty].fee}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

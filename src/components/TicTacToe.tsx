import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Confetti } from './Confetti';
import { WinAnimation } from './WinAnimation';
import { LossAnimation } from './LossAnimation';
import { GameModeSelector } from './GameModeSelector';
import { SettingsModal } from './SettingsModal';
import { type BoardSize } from './BoardSizeSelector';
import { AIPlayer, Difficulty } from '../utils/aiPlayer';

export function TicTacToe() {
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
  // Game is idle (board disabled) until the user explicitly starts a game.
  const [gameStarted, setGameStarted] = useState(false);

  const player1 = users[0] || { id: '1', name: 'Player 1', wins: 0, losses: 0, draws: 0 };
  const player2 = users[1] || { id: '2', name: 'Computer', wins: 0, losses: 0, draws: 0 };

  // Get the win length based on board size
  const getWinLength = (size: number): number => {
    return size === 3 ? 3 : 4; // 3x3 needs 3 in a row, larger boards need 4
  };

  const generateWinningLines = (size: number, winLength: number): number[][] => {
    const lines: number[][] = [];
    const actualWinLength = winLength || getWinLength(size);

    // Horizontal lines - all possible consecutive sequences
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - actualWinLength; col++) {
        const line: number[] = [];
        for (let i = 0; i < actualWinLength; i++) {
          line.push(row * size + col + i);
        }
        lines.push(line);
      }
    }

    // Vertical lines - all possible consecutive sequences
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - actualWinLength; row++) {
        const line: number[] = [];
        for (let i = 0; i < actualWinLength; i++) {
          line.push((row + i) * size + col);
        }
        lines.push(line);
      }
    }

    // Diagonal (top-left to bottom-right) - all possible sequences
    for (let startRow = 0; startRow <= size - actualWinLength; startRow++) {
      for (let startCol = 0; startCol <= size - actualWinLength; startCol++) {
        const line: number[] = [];
        for (let i = 0; i < actualWinLength; i++) {
          line.push((startRow + i) * size + (startCol + i));
        }
        lines.push(line);
      }
    }

    // Diagonal (top-right to bottom-left) - all possible sequences
    for (let startRow = 0; startRow <= size - actualWinLength; startRow++) {
      for (let startCol = actualWinLength - 1; startCol < size; startCol++) {
        const line: number[] = [];
        for (let i = 0; i < actualWinLength; i++) {
          line.push((startRow + i) * size + (startCol - i));
        }
        lines.push(line);
      }
    }

    return lines;
  };

  const calculateWinner = (squares: (string | null)[], size: number): { winner: string | null; line: number[] | null } => {
    const winLength = getWinLength(size);
    const lines = generateWinningLines(size, winLength);

    for (const line of lines) {
      const firstSquare = squares[line[0]];
      if (firstSquare && line.every((index) => squares[index] === firstSquare)) {
        return { winner: firstSquare, line };
      }
    }
    return { winner: null, line: null };
  };

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
        // Record win/loss
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
        setAiThinking(false);
        return;
      }

      setBoard(newBoard);
      setIsXNext(true);
      setAiThinking(false);
    }, 600);
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
      // Record win/loss
      recordWin(player1.id);
      recordLoss(player2.id);
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner('draw');
      recordDraw([player1.id, player2.id]);
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

  const confirmReset = () => {
    setShowResetConfirm(false);
    resetGame();
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
      users[1] = { ...users[1], name: 'Computer' };
    } else {
      users[1] = { ...users[1], name: 'Player 2' };
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

  // Timer applies only to human turns: PvP both players, AI mode only when X (human) moves.
  const timerActive =
    gameStarted &&
    !gameOver &&
    !aiThinking &&
    !showSettings &&
    (gameMode === 'pvp' || isXNext);

  // Countdown + auto-play random on timeout.
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft <= 0) {
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

  const getDifficultyLabel = () => {
    const labels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return labels[difficulty];
  };

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
        />
      )}
      {showLossNotice && gameMode === 'ai' && winner !== null && winner !== 'draw' && (
        <LossAnimation 
          show={gameOver && winner !== null && winner !== 'draw'} 
          playerName={winner === 'X' ? 'You Won!' : 'You Lost!'}
          isPlayerWin={winner === 'X'}
          onClose={() => setShowLossNotice(false)}
        />
      )}

      {/* Confetti only for PvP wins or AI player wins */}
      {gameMode === 'pvp' && (
        <Confetti trigger={gameOver && winner !== 'draw' && winner !== null} />
      )}
      {gameMode === 'ai' && winner === 'X' && (
        <Confetti trigger={gameOver && winner !== null} />
      )}

      {/* Toolbar: mode toggle + settings */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <GameModeSelector selectedMode={gameMode} onModeChange={handleGameModeChange} />
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex-shrink-0 h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-slate-700/80 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          title="Settings"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

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
        className={`rounded-2xl border backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 ${
          gameOver && winner !== 'draw' && winner !== null
            ? 'bg-slate-900/80 border-yellow-500/30 shadow-yellow-500/10 animate-pulse-board'
            : 'bg-slate-900/70 border-white/8'
        }`}
      >
        {/* Status bar */}
        <div className="text-center px-4 sm:px-6 pt-5 pb-4 border-b border-white/5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            {boardSize}×{boardSize}
            {gameMode === 'ai' && ` · AI ${getDifficultyLabel()}`}
            {' · '}{boardSize === 3 ? '3 in a row' : '4 in a row'}
          </div>
          <h2 className={`text-xl sm:text-2xl font-black text-white ${gameOver ? 'animate-bounce-in' : ''}`}>
            {!gameStarted ? (
              <span className="text-slate-300">Tap <span className="text-violet-400">Start Game</span> to begin</span>
            ) : aiThinking ? (
              <span className="text-violet-300 animate-pulse">🤖 Thinking…</span>
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

          {/* Turn timer */}
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
        </div>

        {/* Game Board */}
        <div className="py-5 sm:py-6 w-full flex justify-center overflow-hidden px-3 sm:px-4">
          <div
            className="bg-black/30 rounded-xl border border-white/5"
            style={{
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
                  className={`rounded-2xl font-black transition-all duration-150 flex items-center justify-center
                    ${
                      value === 'X'
                        ? 'bg-sky-500/20 text-sky-300 border-2 border-sky-500/50 animate-bounce-in shadow-lg shadow-sky-500/20'
                        : value === 'O'
                        ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/50 animate-bounce-in shadow-lg shadow-rose-500/20'
                        : 'bg-white/4 border-2 border-white/10 hover:bg-violet-500/10 hover:border-violet-400/50 hover:shadow-md hover:shadow-violet-500/20 cursor-pointer'
                    }
                    ${isWinningSquare ? 'ring-2 ring-yellow-400 bg-yellow-500/25 border-yellow-400/60 shadow-lg shadow-yellow-500/30' : ''}
                    disabled:cursor-not-allowed active:scale-95 hover:scale-105
                  `}
                >
                  <span className={isWinningSquare && gameOver ? 'text-yellow-200 drop-shadow-lg' : ''}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pb-5 sm:pb-6">
          <button
            onClick={requestReset}
            className={`px-7 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 ${
              !gameStarted || gameOver
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 animate-bounce-in'
                : 'bg-white/6 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
            }`}
          >
            {!gameStarted ? '🎮 Start Game' : gameOver ? '🎮 Play Again' : 'New Game'}
          </button>
        </div>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

        {/* Player 2 / Computer */}
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
                <h3 className="text-xs sm:text-base font-bold text-white truncate">
                  🤖 {player2.name}
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
      </div>

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
                {!gameStarted
                  ? `Ready to play ${gameMode === 'ai' ? 'against the computer' : 'a match'}?`
                  : gameOver
                  ? 'Begin a fresh round on the same board.'
                  : 'Your current game progress will be lost.'}
              </p>
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 transition-all duration-200"
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

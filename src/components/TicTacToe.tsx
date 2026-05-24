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
    if (gameOver || board[index] !== null || aiThinking) return;

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

    if (gameOver || board[index] !== null) return;

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

  // Calculate responsive board dimensions - Full width on mobile without overflow
  const getSquareSize = () => {
    const gap = screenWidth < 640 ? 2 : screenWidth < 1024 ? 5 : 6;
    const padding = screenWidth < 640 ? 8 : 16;

    // Mobile: make board fit exactly within viewport
    if (screenWidth < 640) {
      // Horizontal chrome around the grid on mobile:
      //   header `p-3`  = 12px * 2 = 24
      //   board wrapper `px-1` = 4px * 2 = 8
      // Plus a 2px safety buffer to avoid sub-pixel overflow.
      const parentChrome = 24 + 8 + 2;
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
    <div className="space-y-2 sm:space-y-6 min-h-screen">
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

      {/* Game Mode Selector */}
      <GameModeSelector selectedMode={gameMode} onModeChange={handleGameModeChange} />

      {/* Game Settings Button */}
      <div className="flex justify-center px-2">
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-sm sm:text-base font-semibold hover:from-cyan-500 hover:to-cyan-400 transition-all duration-200 shadow-lg hover:scale-105 flex items-center gap-2"
        >
          <span>⚙️</span>
          <span>Settings</span>
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
        gameOver={gameOver}
      />

      {/* Game Header */}
      <div
        className={`rounded-none sm:rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 sm:p-6 sm:mx-auto sm:max-w-4xl sm:rounded-xl backdrop-blur-sm border-0 sm:border border-purple-500/30 transition-all duration-300 -mx-4 sm:mx-auto ${
          gameOver && winner !== 'draw' && winner !== null ? 'animate-pulse-board' : ''
        }`}
      >
        <div className="text-center mb-2 sm:mb-4 px-1 sm:px-2">
          <h2
            className={`text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 ${gameOver ? 'animate-bounce-in' : ''}`}
          >
            {aiThinking ? (
              <span className="animate-pulse">🤖 Computer is thinking...</span>
            ) : gameOver ? (
              winner === 'draw' ? (
                "It's a Draw! 🤝"
              ) : (
                `${winner === 'X' ? player1.name : player2.name} Wins! 🎉`
              )
            ) : (
              `${currentPlayerObj.name}'s Turn`
            )}
          </h2>
          
          {/* Difficulty and Board Info */}
          <div className="flex justify-center items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2 flex-wrap">
            <span>📋 {boardSize}x{boardSize}</span>
            {gameMode === 'ai' && <span>🤖 {getDifficultyLabel()}</span>}
          </div>

          {/* Win Condition Instruction */}
          <div className="text-center text-xs sm:text-sm text-yellow-300 mb-2 sm:mb-3 px-2">
            {boardSize === 3 ? (
              <span>✓ Get 3 in a row to win</span>
            ) : (
              <span>✓ Get 4 in a row to win</span>
            )}
          </div>

          {!gameOver && !aiThinking && (
            <div className="flex justify-center items-center gap-2 px-2 flex-wrap">
              <span className="text-sm sm:text-lg font-semibold text-white">Current:</span>
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {currentPlayer}
              </span>
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="mb-2 sm:mb-8 w-full flex justify-center overflow-hidden px-1">
          <div
            className="bg-slate-900/50 rounded-lg border-0 sm:border border-purple-500/20"
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
                  disabled={gameOver || value !== null || aiThinking}
                  style={{
                    boxSizing: 'border-box',
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                    fontSize: `${squareSize * 0.5}px`,
                  }}
                  className={`rounded-xl font-black transition-all duration-200 border-4 flex items-center justify-center shadow-lg
                    ${
                      value === 'X'
                        ? 'bg-blue-500/30 text-blue-300 border-blue-400 animate-bounce-in shadow-blue-500/50'
                        : value === 'O'
                        ? 'bg-red-500/30 text-red-300 border-red-400 animate-bounce-in shadow-red-500/50'
                        : 'bg-slate-700/50 border-slate-500 hover:bg-slate-600/50 hover:border-purple-400 hover:shadow-purple-500/50 cursor-pointer'
                    }
                    ${isWinningSquare ? 'ring-4 ring-yellow-400 bg-yellow-500/30 shadow-yellow-500/50' : ''}
                    disabled:cursor-not-allowed hover:scale-105
                  `}
                >
                  <span className={isWinningSquare && gameOver ? 'line-through text-yellow-200 font-black drop-shadow-lg' : ''}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center mt-2 sm:mt-4">
          <button
            onClick={resetGame}
            className={`px-4 sm:px-8 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-base font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-200 shadow-lg ${
              gameOver ? 'animate-bounce-in' : 'hover:scale-105'
            }`}
          >
            {gameOver ? 'Play Again' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-1 sm:gap-4 sm:px-2">
        {/* Player 1 */}
        <div
          className={`rounded-lg p-3 sm:p-5 backdrop-blur-sm border-2 transition-all ${
            gameOver && winner === 'X'
              ? 'bg-green-500/30 border-green-500 ring-2 ring-green-500/50 animate-bounce-in'
              : gameOver && winner !== null && winner !== 'draw' && winner === 'O'
              ? 'bg-red-500/20 border-red-500 animate-shake'
              : !gameOver && currentPlayer === 'X'
              ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50'
              : 'bg-slate-800/50 border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="min-w-0">
              {editingPlayer === player1.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(player1.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleRename(player1.id);
                  }}
                  className="px-2 py-1 text-sm rounded bg-slate-700 text-white border border-slate-500 focus:outline-none focus:border-blue-500 w-full"
                />
              ) : (
                <h3
                  className="text-sm sm:text-lg font-bold text-white cursor-pointer hover:text-blue-400 truncate"
                  onClick={() => {
                    setEditingPlayer(player1.id);
                    setEditName(player1.name);
                  }}
                >
                  {player1.name}
                </h3>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-blue-400 flex-shrink-0">X</span>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Wins:</span>
              <span className="font-semibold text-green-400">{player1.wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Losses:</span>
              <span className="font-semibold text-red-400">{player1.losses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Draws:</span>
              <span className="font-semibold text-yellow-400">{player1.draws}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-600">
              <span className="text-slate-300">Total:</span>
              <span className="font-semibold text-white">
                {player1.wins + player1.losses + player1.draws}
              </span>
            </div>
          </div>
        </div>

        {/* Player 2 / Computer */}
        <div
          className={`rounded-lg p-3 sm:p-5 backdrop-blur-sm border-2 transition-all ${
            gameOver && winner === 'O'
              ? 'bg-green-500/30 border-green-500 ring-2 ring-green-500/50 animate-bounce-in'
              : gameOver && winner !== null && winner !== 'draw' && winner === 'X'
              ? 'bg-red-500/20 border-red-500 animate-shake'
              : !gameOver && currentPlayer === 'O'
              ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/50'
              : 'bg-slate-800/50 border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="min-w-0">
              {gameMode === 'ai' ? (
                <h3 className="text-sm sm:text-lg font-bold text-white truncate">
                  🤖 {player2.name}
                </h3>
              ) : editingPlayer === player2.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(player2.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleRename(player2.id);
                  }}
                  className="px-2 py-1 text-sm rounded bg-slate-700 text-white border border-slate-500 focus:outline-none focus:border-red-500 w-full"
                />
              ) : (
                <h3
                  className="text-sm sm:text-lg font-bold text-white cursor-pointer hover:text-red-400 truncate"
                  onClick={() => {
                    setEditingPlayer(player2.id);
                    setEditName(player2.name);
                  }}
                >
                  {player2.name}
                </h3>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-red-400 flex-shrink-0">O</span>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Wins:</span>
              <span className="font-semibold text-green-400">{player2.wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Losses:</span>
              <span className="font-semibold text-red-400">{player2.losses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Draws:</span>
              <span className="font-semibold text-yellow-400">{player2.draws}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-600">
              <span className="text-slate-300">Total:</span>
              <span className="font-semibold text-white">
                {player2.wins + player2.losses + player2.draws}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

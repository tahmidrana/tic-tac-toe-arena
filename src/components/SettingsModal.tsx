import { BoardSizeSelector, BoardSize } from './BoardSizeSelector';
import { DifficultySelector } from './DifficultySelector';
import { Difficulty } from '../utils/aiPlayer';

export function SettingsModal({
  isOpen,
  onClose,
  boardSize,
  onBoardSizeChange,
  gameMode,
  difficulty,
  onDifficultyChange,
  locked,
}: {
  isOpen: boolean;
  onClose: () => void;
  boardSize: BoardSize;
  onBoardSizeChange: (size: BoardSize) => void;
  gameMode: 'pvp' | 'ai';
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  locked: boolean;
}) {
  if (!isOpen) return null;

  const handleBoardSizeChange = (size: BoardSize) => {
    onBoardSizeChange(size);
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    onDifficultyChange(diff);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      >
        {/* Modal */}
        <div
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-500/50 shadow-2xl max-w-md w-full animate-bounce-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-purple-500/30 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>Game Settings</span>
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Board Size Selector */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                📏 Board Size
              </h3>
              <BoardSizeSelector
                boardSize={boardSize}
                onBoardSizeChange={handleBoardSizeChange}
                disabled={locked}
              />
            </div>

            {/* Difficulty Selector - Only show in AI mode */}
            {gameMode === 'ai' && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  🎯 Opponent Skill
                </h3>
                <DifficultySelector
                  difficulty={difficulty}
                  onDifficultyChange={handleDifficultyChange}
                  disabled={locked}
                />
              </div>
            )}

            {/* Info Text */}
            <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-700">
              {locked ? (
                <p>⚠️ Settings locked during active gameplay</p>
              ) : (
                <p>✅ Settings available — changes apply to your next game</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-purple-500/30 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-200 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

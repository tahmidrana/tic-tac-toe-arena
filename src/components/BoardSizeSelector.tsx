export type BoardSize = 3 | 4 | 5 | 6;

export function BoardSizeSelector({
  boardSize,
  onBoardSizeChange,
  disabled,
}: {
  boardSize: BoardSize;
  onBoardSizeChange: (size: BoardSize) => void;
  disabled?: boolean;
}) {
  const sizes: BoardSize[] = [3, 4, 5, 6];

  return (
    <div className={`rounded-lg bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 backdrop-blur-sm border border-purple-500/30 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="text-xs font-bold text-white mb-2">Board Size</div>
      <div className="grid grid-cols-4 gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onBoardSizeChange(size)}
            disabled={disabled}
            title={`${size}x${size} board`}
            className={`px-2 py-2 rounded text-sm font-semibold transition-all duration-200 ${
              boardSize === size
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg ring-2 ring-orange-400'
                : 'bg-slate-700/50 text-white hover:bg-slate-600/50 border border-slate-600'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {size}x{size}
          </button>
        ))}
      </div>
    </div>
  );
}

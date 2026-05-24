import { Difficulty } from '../utils/aiPlayer';

export function DifficultySelector({
  difficulty,
  onDifficultyChange,
  disabled,
}: {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}) {
  const difficulties: { level: Difficulty; emoji: string; label: string }[] = [
    { level: 'easy', emoji: '😊', label: 'Easy' },
    { level: 'medium', emoji: '🤔', label: 'Medium' },
    { level: 'hard', emoji: '🤖', label: 'Hard' },
  ];

  return (
    <div className={`rounded-lg bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 backdrop-blur-sm border border-purple-500/30 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="text-xs font-bold text-white mb-2">Difficulty</div>
      <div className="flex gap-2">
        {difficulties.map((item) => (
          <button
            key={item.level}
            onClick={() => onDifficultyChange(item.level)}
            disabled={disabled}
            className={`flex-1 px-2 py-2 rounded text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
              difficulty === item.level
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg ring-2 ring-cyan-400'
                : 'bg-slate-700/50 text-white hover:bg-slate-600/50 border border-slate-600'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>{item.emoji}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

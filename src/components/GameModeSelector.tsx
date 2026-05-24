export function GameModeSelector({
  selectedMode,
  onModeChange,
}: {
  selectedMode: 'pvp' | 'ai';
  onModeChange: (mode: 'pvp' | 'ai') => void;
}) {
  return (
    <div className="flex bg-slate-800/80 rounded-xl p-1 border border-white/10 shadow-inner gap-1">
      <button
        onClick={() => onModeChange('pvp')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          selectedMode === 'pvp'
            ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>👥</span>
        <span className="hidden sm:inline">Player vs Player</span>
        <span className="sm:hidden">PvP</span>
      </button>
      <button
        onClick={() => onModeChange('ai')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          selectedMode === 'ai'
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>🤖</span>
        <span className="hidden sm:inline">vs Computer</span>
        <span className="sm:hidden">AI</span>
      </button>
    </div>
  );
}

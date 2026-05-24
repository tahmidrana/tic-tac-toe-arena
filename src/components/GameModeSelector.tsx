export function GameModeSelector({
  selectedMode,
  onModeChange,
}: {
  selectedMode: 'pvp' | 'ai';
  onModeChange: (mode: 'pvp' | 'ai') => void;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 backdrop-blur-sm border border-purple-500/30">
      <h3 className="text-lg font-bold text-white mb-4">Game Mode</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onModeChange('pvp')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selectedMode === 'pvp'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg ring-2 ring-blue-400'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-slate-600'
          }`}
        >
          👥 Player vs Player
        </button>
        <button
          onClick={() => onModeChange('ai')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selectedMode === 'ai'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg ring-2 ring-purple-400'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-slate-600'
          }`}
        >
          🤖 vs Computer
        </button>
      </div>
    </div>
  );
}

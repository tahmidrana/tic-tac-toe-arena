export function GameModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: {
  selectedMode: 'pvp' | 'ai';
  onModeChange: (mode: 'pvp' | 'ai') => void;
  disabled?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* PvP */}
      <button
        onClick={() => onModeChange('pvp')}
        disabled={disabled}
        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 overflow-hidden ${
          selectedMode === 'pvp'
            ? 'bg-gradient-to-r from-sky-600/25 to-blue-700/15 border-sky-500/50 shadow-md shadow-sky-500/10'
            : 'bg-slate-800/50 border-white/8 hover:bg-slate-800/80 hover:border-white/15'
        }`}
      >
        {selectedMode === 'pvp' && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
        )}
        <span className={`text-xl transition-all ${selectedMode === 'pvp' ? 'scale-110' : 'opacity-60'}`}>👥</span>
        <div className="text-left min-w-0">
          <p className={`text-xs font-black leading-tight ${selectedMode === 'pvp' ? 'text-white' : 'text-slate-400'}`}>
            Player vs Player
          </p>
          <p className="text-[10px] text-slate-600 hidden sm:block">Two humans</p>
        </div>
        {selectedMode === 'pvp' && (
          <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-sky-400" />
        )}
      </button>

      {/* vs AI */}
      <button
        onClick={() => onModeChange('ai')}
        disabled={disabled}
        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 overflow-hidden ${
          selectedMode === 'ai'
            ? 'bg-gradient-to-r from-violet-600/25 to-purple-700/15 border-violet-500/50 shadow-md shadow-violet-500/10'
            : 'bg-slate-800/50 border-white/8 hover:bg-slate-800/80 hover:border-white/15'
        }`}
      >
        {selectedMode === 'ai' && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
        )}
        <span className={`text-xl transition-all ${selectedMode === 'ai' ? 'scale-110' : 'opacity-60'}`}>🤖</span>
        <div className="text-left min-w-0">
          <p className={`text-xs font-black leading-tight ${selectedMode === 'ai' ? 'text-white' : 'text-slate-400'}`}>
            vs AI
          </p>
          <p className="text-[10px] text-slate-600 hidden sm:block">Play solo</p>
        </div>
        {selectedMode === 'ai' && (
          <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400" />
        )}
      </button>
    </div>
  );
}

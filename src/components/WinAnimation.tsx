export function WinAnimation({ winner, playerName, onClose, isDraw: isDrawProp }: { winner: string | null; playerName: string; onClose?: () => void; isDraw?: boolean }) {
  if (!winner) return null;

  const isWin = winner !== 'draw';
  const isDraw = isDrawProp !== undefined ? isDrawProp : winner === 'draw';

  return (
    <>
      {isWin && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          {/* Victory burst effect */}
          <div className="relative">
            {/* Main trophy/star burst */}
            <div className="animate-bounce-in">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-spin-fast opacity-70" />
                
                {/* Middle ring */}
                <div className="absolute inset-4 rounded-full border-2 border-yellow-300 animate-pulse opacity-60" />
                
                {/* Inner glow */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 blur-xl opacity-50 animate-pulse" />
                
                {/* Trophy icon */}
                <div className="relative z-10 text-6xl animate-glow">🏆</div>
              </div>
            </div>

            {/* Spark effects around trophy */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const distance = 100;
              const x = Math.cos((angle * Math.PI) / 180) * distance;
              const y = Math.sin((angle * Math.PI) / 180) * distance;

              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
                  style={{
                    left: `50%`,
                    top: `50%`,
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {isDraw && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-bounce-in">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Draw handshake effect */}
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-pulse opacity-70" />
              
              <div className="absolute inset-4 rounded-full border-2 border-cyan-300 opacity-60" />
              
              <div className="absolute inset-8 rounded-full bg-gradient-to-b from-cyan-300 to-cyan-500 blur-xl opacity-50 animate-pulse" />
              
              <div className="relative z-10 text-6xl animate-glow" style={{
                textShadow: '0 0 5px rgba(34, 211, 238, 0.5), 0 0 10px rgba(34, 211, 238, 0.3)'
              }}>
                🤝
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory text banner - Positioned at board center */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="animate-bounce-in">
          <div className={`rounded-2xl py-6 px-8 text-center text-white font-bold text-2xl shadow-2xl flex items-center justify-between gap-4 ring-4 ${
            isDraw
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 ring-cyan-400'
              : 'bg-gradient-to-r from-yellow-600 to-amber-600 ring-yellow-400'
          }`}>
            <div className="flex-1">
              {isDraw ? (
                <span>🤝 It's a Draw! 🤝</span>
              ) : (
                <span>🎉 {playerName} Wins! 🎉</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto text-white hover:text-yellow-200 transition-colors font-bold text-xl leading-none hover:scale-125"
              title="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

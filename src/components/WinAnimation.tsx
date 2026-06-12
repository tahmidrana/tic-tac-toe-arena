export function WinAnimation({
  winner,
  playerName,
  onClose,
  isDraw: isDrawProp,
  coinDelta,
}: {
  winner: string | null;
  playerName: string;
  onClose?: () => void;
  isDraw?: boolean;
  coinDelta?: number;
}) {
  if (!winner) return null;

  const isWin = winner !== 'draw';
  const isDraw = isDrawProp !== undefined ? isDrawProp : winner === 'draw';

  const hasCoin = coinDelta !== undefined;
  const coinPositive = hasCoin && coinDelta! >= 0;
  const coinLabel = hasCoin
    ? `${coinDelta! > 0 ? '+' : ''}${coinDelta} 🪙`
    : null;

  return (
    <>
      {isWin && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="relative">
            <div className="animate-bounce-in">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-spin-fast opacity-70" />
                <div className="absolute inset-4 rounded-full border-2 border-yellow-300 animate-pulse opacity-60" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 blur-xl opacity-50 animate-pulse" />
                <div className="relative z-10 text-6xl animate-glow">🏆</div>
              </div>
            </div>

            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const x = Math.cos((angle * Math.PI) / 180) * 100;
              const y = Math.sin((angle * Math.PI) / 180) * 100;
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
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
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-pulse opacity-70" />
              <div className="absolute inset-4 rounded-full border-2 border-cyan-300 opacity-60" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-b from-cyan-300 to-cyan-500 blur-xl opacity-50 animate-pulse" />
              <div className="relative z-10 text-6xl animate-glow" style={{ textShadow: '0 0 5px rgba(34,211,238,0.5)' }}>
                🤝
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="animate-bounce-in relative">

          {/* Floating coin burst — rises above the banner */}
          {hasCoin && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 animate-coin-float pointer-events-none whitespace-nowrap"
              style={{ animationDelay: '0.55s' }}
            >
              <span className={`text-2xl font-black drop-shadow-lg ${coinPositive ? 'text-amber-300' : 'text-red-300'}`}>
                {coinLabel}
              </span>
            </div>
          )}

          <div className={`rounded-2xl py-5 px-7 text-center text-white font-bold text-2xl shadow-2xl ring-4 ${
            isDraw
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 ring-cyan-400'
              : 'bg-gradient-to-r from-yellow-600 to-amber-600 ring-yellow-400'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {isDraw ? <span>🤝 It's a Draw! 🤝</span> : <span>🎉 {playerName} Wins! 🎉</span>}

                {/* Coin badge inside banner */}
                {hasCoin && (
                  <div
                    className="animate-coin-badge mt-2 flex justify-center"
                    style={{ animationDelay: '0.7s' }}
                  >
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border ${
                      coinPositive
                        ? 'bg-amber-400/25 border-amber-300/50 text-amber-200'
                        : 'bg-red-400/25 border-red-300/50 text-red-200'
                    }`}>
                      🪙 {coinLabel}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="pointer-events-auto text-white hover:text-yellow-200 transition-colors font-bold text-xl leading-none hover:scale-125 self-start"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

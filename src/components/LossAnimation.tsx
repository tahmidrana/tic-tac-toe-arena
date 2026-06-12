export function LossAnimation({
  show,
  playerName,
  onClose,
  isPlayerWin,
  coinDelta,
}: {
  show: boolean;
  playerName: string;
  onClose?: () => void;
  isPlayerWin?: boolean;
  coinDelta?: number;
}) {
  if (!show) return null;

  const hasCoin = coinDelta !== undefined;
  const coinPositive = hasCoin && coinDelta! >= 0;
  const coinLabel = hasCoin
    ? `${coinDelta! > 0 ? '+' : ''}${coinDelta} 🪙`
    : null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="animate-shake" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

      <div className="text-center pointer-events-auto">
        <div className="text-8xl animate-bounce mb-4">{isPlayerWin ? '🥳' : '😔'}</div>

        <div
          className={`rounded-2xl py-6 px-8 shadow-2xl animate-bounce-in relative ring-4 ${
            isPlayerWin
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 ring-green-400'
              : 'bg-gradient-to-r from-red-600 to-pink-600 ring-red-400'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          {/* Floating coin burst */}
          {hasCoin && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 animate-coin-float pointer-events-none whitespace-nowrap"
              style={{ animationDelay: '0.65s' }}
            >
              <span className={`text-2xl font-black drop-shadow-lg ${coinPositive ? 'text-amber-300' : 'text-red-300'}`}>
                {coinLabel}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className={`absolute top-3 right-3 text-white transition-colors font-bold text-xl leading-none hover:scale-125 ${
              isPlayerWin ? 'hover:text-green-200' : 'hover:text-red-200'
            }`}
            title="Close"
          >
            ✕
          </button>

          <p className="text-white font-bold text-2xl">{playerName}</p>
          <p className={`text-sm mt-1 ${isPlayerWin ? 'text-green-100' : 'text-red-100'}`}>
            {isPlayerWin ? '🎉 Congratulations!' : 'Better luck next time! 💪'}
          </p>

          {/* Coin badge */}
          {hasCoin && (
            <div
              className="animate-coin-badge mt-3 flex justify-center"
              style={{ animationDelay: '0.85s' }}
            >
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border ${
                coinPositive
                  ? 'bg-amber-400/25 border-amber-300/50 text-amber-200'
                  : 'bg-red-300/20 border-red-300/40 text-red-200'
              }`}>
                🪙 {coinLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl pointer-events-none"
          style={{
            left: `${20 + i * 15}%`,
            top: '-50px',
            animation: 'confetti-fall 2s ease-in forwards',
            animationDelay: `${i * 0.1}s`,
          }}
        >
          😢
        </div>
      ))}
    </div>
  );
}

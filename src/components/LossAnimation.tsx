export function LossAnimation({ show, playerName, onClose, isPlayerWin }: { show: boolean; playerName: string; onClose?: () => void; isPlayerWin?: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      {/* Shaking board effect */}
      <div className="animate-shake" style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none'
      }} />

      {/* Result message - Centered on board */}
      <div className="text-center pointer-events-auto">
        <div className="text-8xl animate-bounce mb-4">{isPlayerWin ? '🥳' : '😔'}</div>
        <div className={`rounded-2xl py-6 px-8 shadow-2xl animate-bounce-in relative ring-4 ${
          isPlayerWin 
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 ring-green-400' 
            : 'bg-gradient-to-r from-red-600 to-pink-600 ring-red-400'
        }`}
          style={{ animationDelay: '0.2s' }}>
          <button
            onClick={onClose}
            className={`absolute top-3 right-3 text-white transition-colors font-bold text-xl leading-none hover:scale-125 ${
              isPlayerWin ? 'hover:text-green-200' : 'hover:text-red-200'
            }`}
            title="Close notification"
          >
            ✕
          </button>
          <p className="text-white font-bold text-2xl">{playerName}</p>
          <p className={`text-sm mt-2 ${isPlayerWin ? 'text-green-100' : 'text-red-100'}`}>
            {isPlayerWin ? '🎉 Congratulations!' : 'Better luck next time! 💪'}
          </p>
        </div>
      </div>

      {/* Falling tears/sad elements */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl pointer-events-none"
          style={{
            left: `${20 + i * 15}%`,
            top: '-50px',
            animation: `confetti-fall 2s ease-in forwards`,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          😢
        </div>
      ))}
    </div>
  );
}

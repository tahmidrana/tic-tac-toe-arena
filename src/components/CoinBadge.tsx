import { useAuth } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

export function CoinBadge() {
  const { user } = useAuth();
  const { users } = useGameStore();

  if (!user) return null;

  const coins = users[0]?.coins ?? 0;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 shadow-sm"
      title="Your coin balance"
    >
      <span className="text-sm leading-none" aria-hidden="true">🪙</span>
      <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
        {coins.toLocaleString()}
      </span>
    </div>
  );
}

import { useGameStore } from '../store/gameStore';

const RANK_BADGES = ['👑', '🥈', '🥉', '🎖️'];
const RANK_COLORS = [
  'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'text-slate-300 bg-slate-500/10 border-slate-500/30',
  'text-amber-600 bg-amber-700/10 border-amber-700/30',
  'text-slate-400 bg-slate-700/10 border-slate-700/30',
];

export function UserRanking() {
  const { getRankedUsers } = useGameStore();
  const rankedUsers = getRankedUsers();

  const winRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    return total === 0 ? 0 : Math.round((wins / total) * 100);
  };

  return (
    <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/8 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-base sm:text-lg font-black text-white">Leaderboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">Ranked by win rate</p>
      </div>

      {/* Rankings */}
      <div className="p-3 sm:p-4 space-y-2">
        {rankedUsers.map((user, index) => {
          const total = user.wins + user.losses + user.draws;
          const rate = winRate(user.wins, user.losses, user.draws);

          return (
            <div
              key={user.id}
              className={`rounded-xl p-3 sm:p-4 border transition-all duration-200 hover:bg-white/4 ${
                index === 0
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-white/2 border-white/6'
              }`}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <span className={`text-sm font-bold w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${RANK_COLORS[index] ?? RANK_COLORS[3]}`}>
                  {RANK_BADGES[index] ?? `${index + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">{total} games</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-emerald-400">{rate}%</p>
                  <p className="text-xs text-slate-500">win rate</p>
                </div>
              </div>

              {/* Win rate bar */}
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${rate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-emerald-500/10 py-1">
                  <p className="text-xs font-bold text-emerald-400">{user.wins}</p>
                  <p className="text-xs text-slate-600">W</p>
                </div>
                <div className="rounded-lg bg-red-500/10 py-1">
                  <p className="text-xs font-bold text-red-400">{user.losses}</p>
                  <p className="text-xs text-slate-600">L</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 py-1">
                  <p className="text-xs font-bold text-yellow-400">{user.draws}</p>
                  <p className="text-xs text-slate-600">D</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block" />
        <p className="text-xs text-slate-500">Live leaderboard · Tiebreaker: total wins</p>
      </div>
    </div>
  );
}

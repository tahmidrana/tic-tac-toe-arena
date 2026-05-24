import { useGameStore } from '../store/gameStore';

export function UserRanking() {
  const { getRankedUsers } = useGameStore();
  const rankedUsers = getRankedUsers();

  const calculateWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const calculateRank = (index: number) => {
    const ranks = ['👑', '🥈', '🥉', '🎖️'];
    return ranks[index] || `${index + 1}#`;
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 backdrop-blur-sm border border-purple-500/30">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Leaderboard</h2>
        <p className="text-slate-400 text-sm">Global Rankings</p>
      </div>

      <div className="space-y-3">
        {rankedUsers.map((user, index) => {
          const totalGames = user.wins + user.losses + user.draws;
          const winRate = calculateWinRate(user.wins, user.losses, user.draws);

          return (
            <div
              key={user.id}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-600 hover:border-purple-500/50 transition-all duration-200 hover:bg-slate-800/70"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{calculateRank(index)}</span>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400">{totalGames} games played</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{user.wins}W</p>
                  <p className="text-xs text-slate-400">{winRate}% win rate</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-green-500/20 py-2 px-1">
                  <p className="text-green-400 font-semibold">{user.wins}</p>
                  <p className="text-slate-400">Wins</p>
                </div>
                <div className="rounded bg-red-500/20 py-2 px-1">
                  <p className="text-red-400 font-semibold">{user.losses}</p>
                  <p className="text-slate-400">Losses</p>
                </div>
                <div className="rounded bg-yellow-500/20 py-2 px-1">
                  <p className="text-yellow-400 font-semibold">{user.draws}</p>
                  <p className="text-slate-400">Draws</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-slate-600">
        <p className="text-xs text-slate-400 mb-3">Ranking System</p>
        <div className="space-y-2 text-xs text-slate-400">
          <p>📊 Ranked by win rate</p>
          <p>🎯 Tiebreaker: Total wins</p>
          <p>🏆 Live leaderboard</p>
        </div>
      </div>
    </div>
  );
}

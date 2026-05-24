import { useGameStore, type User } from '../store/gameStore';
import { useGlobalLeaderboard, type LeaderboardUser } from '../store/leaderboardStore';
import { useAuth } from '../store/authStore';

const TOP_N = 15;
const RANK_BADGES = ['👑', '🥈', '🥉'];

function rankPrefix(rank: number): string {
  return RANK_BADGES[rank - 1] ?? `#${rank}`;
}

function rankClasses(rank: number): string {
  if (rank === 1) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  if (rank === 2) return 'text-slate-200 bg-slate-500/10 border-slate-500/30';
  if (rank === 3) return 'text-amber-500 bg-amber-700/10 border-amber-700/30';
  return 'text-slate-400 bg-white/4 border-white/10';
}

function Avatar({ user }: { user: { name: string; photoURL: string | null } }) {
  const initial = (user.name || '?').charAt(0).toUpperCase();
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full flex-shrink-0 border border-white/10"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black">
      {initial}
    </div>
  );
}

function LeaderboardRow({
  user,
  rank,
  isMe,
}: {
  user: LeaderboardUser;
  rank: number;
  isMe: boolean;
}) {
  const winRatePct = Math.round(user.winRate * 100);
  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors ${
        isMe
          ? 'bg-violet-500/15 border-violet-500/40 ring-1 ring-violet-500/30'
          : 'bg-white/2 border-white/6 hover:bg-white/5'
      }`}
    >
      <span
        className={`text-xs font-bold w-9 h-7 rounded-md flex items-center justify-center border flex-shrink-0 tabular-nums ${rankClasses(rank)}`}
      >
        {rankPrefix(rank)}
      </span>
      <Avatar user={user} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate flex items-center gap-1.5">
          {user.name}
          {isMe && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded">
              You
            </span>
          )}
        </p>
        <p className="text-[11px] text-slate-500 tabular-nums">
          <span className="text-emerald-400">{user.wins}W</span>
          <span className="mx-1 text-slate-700">·</span>
          <span className="text-red-400">{user.losses}L</span>
          <span className="mx-1 text-slate-700">·</span>
          <span className="text-yellow-400">{user.draws}D</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-emerald-400 tabular-nums">{winRatePct}%</p>
        <p className="text-[10px] text-slate-500">{user.totalGames} {user.totalGames === 1 ? 'game' : 'games'}</p>
      </div>
    </div>
  );
}

// Convert a local User (no photo) to LeaderboardUser shape for rendering.
function toLeaderboardUser(u: User): LeaderboardUser {
  const total = u.wins + u.losses + u.draws;
  return {
    id: u.id,
    name: u.name,
    photoURL: null,
    wins: u.wins,
    losses: u.losses,
    draws: u.draws,
    totalGames: total,
    winRate: total === 0 ? 0 : u.wins / total,
  };
}

export function UserRanking() {
  const { isConfigured, user: authUser } = useAuth();
  const { users: globalUsers, loading, error, currentUserRank, currentUser } =
    useGlobalLeaderboard();
  const { getRankedUsers } = useGameStore();

  // Without Firebase, fall back to the local 2-player ranking.
  if (!isConfigured) {
    const localList = getRankedUsers().map(toLeaderboardUser);
    return (
      <Shell title="Leaderboard" subtitle="Local rankings — sign-in to compete globally">
        {localList.length === 0 ? (
          <EmptyHint message="No games yet" />
        ) : (
          <div className="space-y-1.5">
            {localList.map((u, i) => (
              <LeaderboardRow key={u.id} user={u} rank={i + 1} isMe={false} />
            ))}
          </div>
        )}
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell title="Global Leaderboard" subtitle="Loading…">
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-white/4 animate-pulse" />
          ))}
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell title="Global Leaderboard" subtitle="Error loading rankings">
        <p className="text-xs text-red-400 px-2">{error}</p>
      </Shell>
    );
  }

  if (globalUsers.length === 0) {
    return (
      <Shell title="Global Leaderboard" subtitle="Be the first">
        <EmptyHint message="No players yet — sign in and play a game to claim #1 👑" />
      </Shell>
    );
  }

  const topUsers = globalUsers.slice(0, TOP_N);
  const isCurrentUserInTop =
    currentUserRank !== null && currentUserRank <= TOP_N;
  const showSelfRow =
    authUser && currentUser && currentUserRank !== null && !isCurrentUserInTop;

  return (
    <Shell
      title="Global Leaderboard"
      subtitle={`Top ${TOP_N} · ${globalUsers.length} ${globalUsers.length === 1 ? 'player' : 'players'}`}
    >
      <div className="space-y-1.5">
        {topUsers.map((u, i) => (
          <LeaderboardRow
            key={u.id}
            user={u}
            rank={i + 1}
            isMe={authUser?.uid === u.id}
          />
        ))}
      </div>

      {showSelfRow && (
        <>
          <div className="flex items-center gap-2 my-3 px-1">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Your rank
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <LeaderboardRow
            user={currentUser!}
            rank={currentUserRank!}
            isMe
          />
        </>
      )}

      {!authUser && (
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-xs text-violet-200 text-center">
          Sign in to see <span className="font-bold">your rank</span> on the board
        </div>
      )}
    </Shell>
  );
}

// ---------- Shell ----------

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/8 shadow-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block" />
        <p className="text-xs text-slate-500">Ranked by win rate · Live</p>
      </div>
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="px-3 py-6 text-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

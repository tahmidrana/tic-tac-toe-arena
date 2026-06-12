import { useGameStore, type User } from '../store/gameStore';
import { useGlobalLeaderboard, type LeaderboardUser } from '../store/leaderboardStore';
import { useAuth, signInWithGoogle } from '../store/authStore';

const TOP_N = 15;
const MIN_DISPLAY = 10;
const RANK_BADGES = ['👑', '🥈', '🥉'];

const FAKE_NAMES = [
  'ShadowFox', 'PixelKnight', 'NeonWolf', 'CrypticAce', 'BlazeThorn',
  'IronClad', 'StormRider', 'VoidHunter', 'SwiftClaw', 'DarkMatter',
  'FrostByte', 'TurboGhost', 'LunarEdge', 'CosmicRay', 'GlitchKing',
];

function makeFakeUser(seed: number): LeaderboardUser {
  const wins = 5 + ((seed * 7 + 3) % 40);
  const losses = 2 + ((seed * 11 + 5) % 20);
  const draws = (seed * 3) % 8;
  const total = wins + losses + draws;
  return {
    id: `fake-${seed}`,
    name: FAKE_NAMES[seed % FAKE_NAMES.length],
    photoURL: null,
    wins,
    losses,
    draws,
    totalGames: total,
    winRate: wins / total,
  };
}

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

  const realUsers = globalUsers.slice(0, TOP_N);
  const topUsers = realUsers.length < MIN_DISPLAY
    ? [
        ...realUsers,
        ...Array.from({ length: MIN_DISPLAY - realUsers.length }, (_, i) =>
          makeFakeUser(i + realUsers.length)
        ),
      ]
    : realUsers;
  const isCurrentUserInTop =
    currentUserRank !== null && currentUserRank <= TOP_N;
  const showSelfRow =
    authUser && currentUser && currentUserRank !== null && !isCurrentUserInTop;

  return (
    <Shell
      title="Global Leaderboard"
      subtitle={`Top ${TOP_N} · ${globalUsers.length} ${globalUsers.length === 1 ? 'player' : 'players'}`}
      blurred={!authUser}
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

    </Shell>
  );
}

// ---------- Shell ----------

function Shell({
  title,
  subtitle,
  children,
  blurred = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  blurred?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/8 shadow-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="relative">
        <div className={`p-3 sm:p-4 transition-[filter] duration-300 ${blurred ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
          {children}
        </div>
        {blurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/20">
            <div className="text-3xl">🔒</div>
            <p className="text-sm font-bold text-white text-center px-4">Sign in to view the global leaderboard</p>
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>
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

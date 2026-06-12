import { useState } from 'react';
import { TicTacToe } from './components/TicTacToe';
import { OnlineGame } from './components/OnlineGame';
import { UserRanking } from './components/UserRanking';
import { AuthButton } from './components/AuthButton';
import { SignInBanner } from './components/SignInBanner';
import { useAuth } from './store/authStore';
import { LogoIcon } from './components/LogoIcon';
import { CoinBadge } from './components/CoinBadge';

type TopMode = 'local' | 'online';

export default function App() {
  const [topMode, setTopMode] = useState<TopMode>('local');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1e1040,transparent)] bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoIcon size={36} className="drop-shadow-lg flex-shrink-0 sm:hidden" />
              <LogoIcon size={40} className="drop-shadow-lg flex-shrink-0 hidden sm:block" />
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Tic Tac Toe <span className="text-violet-400">Arena</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CoinBadge />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        <SignInBanner />

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Local Play */}
          <button
            onClick={() => setTopMode('local')}
            className={`relative group flex flex-col items-center sm:flex-row sm:items-center sm:gap-4 gap-2 p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden text-left ${
              topMode === 'local'
                ? 'bg-gradient-to-br from-sky-600/25 to-blue-700/15 border-sky-500/50 shadow-xl shadow-sky-500/10'
                : 'bg-slate-800/40 border-white/8 hover:bg-slate-800/60 hover:border-white/15'
            }`}
          >
            {/* Active glow */}
            {topMode === 'local' && (
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/8 to-transparent pointer-events-none" />
            )}
            {/* Top glow line */}
            {topMode === 'local' && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
            )}

            <div className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 ${
              topMode === 'local'
                ? 'bg-gradient-to-br from-sky-500/30 to-blue-600/20 border border-sky-400/40 shadow-lg shadow-sky-500/20'
                : 'bg-white/5 border border-white/10 group-hover:border-white/20'
            }`}>
              🎮
            </div>

            <div className="relative flex-1 min-w-0">
              <p className={`font-black text-sm sm:text-base leading-tight transition-colors ${topMode === 'local' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                Local Play
              </p>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Player vs Player · vs AI</p>
            </div>

            {topMode === 'local' ? (
              <span className="relative flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Playing
              </span>
            ) : (
              <span className="relative flex-shrink-0 text-[10px] font-semibold text-slate-600 hidden sm:block">
                Click to play
              </span>
            )}
          </button>

          {/* Online Play */}
          <button
            onClick={() => setTopMode('online')}
            className={`relative group flex flex-col items-center sm:flex-row sm:items-center sm:gap-4 gap-2 p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden text-left ${
              topMode === 'online'
                ? 'bg-gradient-to-br from-emerald-600/25 to-teal-700/15 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                : 'bg-slate-800/40 border-white/8 hover:bg-slate-800/60 hover:border-white/15'
            }`}
          >
            {topMode === 'online' && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
            )}
            {topMode === 'online' && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            )}

            <div className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 ${
              topMode === 'online'
                ? 'bg-gradient-to-br from-emerald-500/30 to-teal-600/20 border border-emerald-400/40 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 border border-white/10 group-hover:border-white/20'
            }`}>
              ⚡
            </div>

            <div className="relative flex-1 min-w-0">
              <p className={`font-black text-sm sm:text-base leading-tight transition-colors ${topMode === 'online' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                Online Play
              </p>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Challenge real players live</p>
            </div>

            {topMode === 'online' ? (
              <span className="relative flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="relative flex-shrink-0 text-[10px] font-semibold text-slate-600 hidden sm:block">
                Click to play
              </span>
            )}
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
          {/* Game Board */}
          <div className="lg:col-span-2">
            {topMode === 'local' ? <TicTacToe /> : <OnlineGame />}
          </div>

          {/* Right column: player stats above leaderboard */}
          <div className="space-y-5 sm:space-y-6">
            {topMode === 'local' && user && <div id="player-stats-slot" />}
            <UserRanking />
          </div>
        </div>
      </main>
    </div>
  );
}

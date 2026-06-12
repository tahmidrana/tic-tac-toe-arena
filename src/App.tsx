import { useState } from 'react';
import { TicTacToe } from './components/TicTacToe';
import { OnlineGame } from './components/OnlineGame';
import { UserRanking } from './components/UserRanking';
import { AuthButton } from './components/AuthButton';
import { SignInBanner } from './components/SignInBanner';

type TopMode = 'local' | 'online';

export default function App() {
  const [topMode, setTopMode] = useState<TopMode>('local');

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1e1040,transparent)] bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 text-white font-black text-xs sm:text-sm select-none">
                XO
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Tic Tac Toe <span className="text-violet-400">Arena</span>
              </h1>
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6">
        <SignInBanner />

        {/* Top-level mode toggle */}
        <div className="flex justify-center">
          <div className="flex bg-slate-800/80 rounded-2xl p-1 border border-white/10 shadow-inner gap-1">
            <button
              onClick={() => setTopMode('local')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                topMode === 'local'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🎮</span>
              <span>Local Play</span>
            </button>
            <button
              onClick={() => setTopMode('online')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                topMode === 'online'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${topMode === 'online' ? 'bg-emerald-300 animate-pulse' : 'bg-slate-500'}`} />
                <span>Online Play</span>
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Game Board */}
          <div className="lg:col-span-2">
            {topMode === 'local' ? <TicTacToe /> : <OnlineGame />}
          </div>

          {/* Right column: player stats above leaderboard */}
          <div className="space-y-6">
            {/* Portal target — TicTacToe portals its player stats here. */}
            {topMode === 'local' && <div id="player-stats-slot" />}
            <UserRanking />
          </div>
        </div>
      </main>
    </div>
  );
}

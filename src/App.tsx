import { TicTacToe } from './components/TicTacToe';
import { UserRanking } from './components/UserRanking';
import { AuthButton } from './components/AuthButton';

export default function App() {
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <TicTacToe />
          </div>

          {/* Leaderboard */}
          <div>
            <UserRanking />
          </div>
        </div>
      </main>
    </div>
  );
}

import { TicTacToe } from './components/TicTacToe';
import { UserRanking } from './components/UserRanking';

export default function App() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-700/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-lg font-bold text-white">♪</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Tic Tac Toe Arena</h1>
            </div>
            <div className="text-sm text-purple-300">2 Player Game</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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

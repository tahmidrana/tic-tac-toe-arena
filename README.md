# Tic Tac Toe Arena - 2 Player Game

A modern, fully-featured Tic Tac Toe game with a global ranking system built with React, Vite, and Tailwind CSS.

## Features

### 🎮 Game Features
- **2-Player Gameplay**: Local multiplayer game with X and O players
- **Interactive Board**: 3x3 grid with smooth click interactions
- **Win Detection**: Automatic detection of winning conditions (3 in a row)
- **Draw Detection**: Recognizes when the board is full with no winner
- **Game Reset**: Easy button to reset and play again

### 📊 Player Management
- **Customizable Names**: Click on player names to rename them
- **Real-time Stats**: Track wins, losses, and draws for each player
- **Session Persistence**: All statistics are saved to localStorage
- **Visual Indicators**: Current player is highlighted during active turn

### 🏆 Global Ranking System
- **Live Leaderboard**: Real-time ranking display
- **Win Rate Calculation**: Players ranked by win percentage
- **Tiebreaker System**: Total wins used as tiebreaker
- **Detailed Stats**: Shows wins, losses, draws, and total games
- **Visual Badges**: Ranking badges (👑 🥈 🥉 🎖️) for top positions

### 🎨 UI/UX
- **Modern Design**: Dark theme with gradient backgrounds
- **Responsive Layout**: Works on desktop and mobile devices
- **Smooth Animations**: Transitions and hover effects
- **Color-Coded Players**: X (Blue) and O (Red) with clear visual distinction
- **Tailwind CSS**: Fully styled with utility-first CSS framework

## How to Play

1. **Start Game**: The game begins with Player 1 (X) going first
2. **Make Move**: Click any empty square on the board to place your mark
3. **Win Condition**: Get 3 marks in a row (horizontal, vertical, or diagonal)
4. **Reset**: Click "Reset Game" to start a new match
5. **Track Stats**: View your statistics on the player cards and leaderboard

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── components/
│   ├── TicTacToe.tsx      # Game board and game logic
│   └── UserRanking.tsx    # Leaderboard component
├── store/
│   └── gameStore.ts       # Game state management and localStorage
├── index.css              # Global styles
└── main.tsx               # React entry point
```

## Technology Stack

- **React 19.2.6**: UI library
- **Vite 7.3.2**: Build tool
- **Tailwind CSS 4.1.17**: Styling
- **TypeScript 5.9.3**: Type safety
- **localStorage**: Persistent storage for player stats

## Data Persistence

Player statistics are automatically saved to the browser's localStorage under the key `ticTacToeUsers`. This means:
- Stats persist across browser sessions
- Each player's record is maintained locally
- You can reset individual player stats through the app

## Ranking Algorithm

Players are ranked based on:
1. **Primary**: Win rate (Wins / Total Games)
2. **Secondary**: Total wins (for tiebreaker)
3. **Display**: Percentage format with badges

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Compatibility

Works on all modern browsers that support:
- ES2020+
- localStorage API
- CSS Grid and Flexbox

Enjoy the game! 🎮

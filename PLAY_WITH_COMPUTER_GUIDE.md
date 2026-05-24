# 🤖 Play with Computer Mode - User Guide

## Getting Started

### Switching to Computer Mode
1. Look for the **Game Mode** selector at the top of the game
2. Click **"🤖 vs Computer"** button
3. The game resets and a **Difficulty Selector** appears

### Selecting Difficulty
Choose your challenge level:
- **😊 Easy** - Very beatable, random moves
- **🤔 Medium** - Moderately challenging, some strategy
- **🤖 Hard** - Unbeatable, perfect play

Click your choice and start playing!

---

## How to Play Against the Computer

### Game Flow
1. **You go first** as X (blue)
2. **Click any empty square** to place your mark
3. **Computer responds** after a short thinking delay
4. **Continue taking turns** until someone wins or the board fills

### Visual Indicators
- **"🤖 Computer is thinking..."** - Wait for the computer's move
- **Your card is highlighted blue** when it's your turn
- **Computer card is highlighted red** when it's thinking
- **Animations celebrate wins** and show defeats

### Making Your Move
- Click any empty square on the board
- X will appear with a bounce animation
- Board is automatically checked for win/draw
- Computer makes its move automatically

---

## Understanding Difficulty Levels

### 😊 Easy Mode
**Best for**: Beginners, children, learning the game

**What it does**:
- Makes completely random moves
- No strategy or planning
- Can be beaten by anyone
- Unpredictable but fun

**Winning Strategy**:
- Just get 3 in a row
- Don't worry about offense/defense
- Perfect for practicing patterns

**Example Matches**:
- Win rate: 99% (you almost always win)
- Fun factor: High
- Challenge factor: Very low

---

### 🤔 Medium Mode
**Best for**: Casual players, intermediate experience

**What it does**:
- 50% of the time plays strategically
- 50% of the time makes random moves
- Tries to win when possible
- Blocks your winning moves sometimes
- Prefers center and corners

**Strategic Elements**:
1. Takes center square (position 4) when available
2. Blocks your 2-in-a-row threats (50% of the time)
3. Tries to complete its own 3-in-a-row (50% of the time)
4. Prioritizes corners over edges

**Winning Strategy**:
- Control the center
- Set up fork opportunities (2 ways to win)
- Play defensively and offensively
- Stay 2-3 moves ahead mentally

**Example Matches**:
- Win rate: 40% (still beatable)
- Draw rate: 30%
- Loss rate: 30%
- Challenge factor: Medium

---

### 🤖 Hard Mode
**Best for**: Experts, challenge seekers, testing your skills

**What it does**:
- Uses the Minimax algorithm
- Evaluates all possible game outcomes
- Always makes the best possible move
- Never makes a mistake
- Will win if you make an error

**Algorithm Details**:
- Looks ahead at all possible moves
- Simulates complete game trees
- Scores positions as: Win (+10), Draw (0), Loss (-10)
- Prefers quicker wins and slower losses
- Guarantees optimal play

**Possible Outcomes**:
- You win: Only if you've already won (impossible on their turn)
- You lose: If you make a critical mistake
- Draw: With perfect play from both sides (most common)

**Winning Strategy**:
- Aim for a draw, not a win
- Play entirely defensively
- Block all threats immediately
- Take the center (forces defensive responses)
- Never create two-way winning threats

**Perfect Play Example**:
```
Move 1: You take center (position 4) - best opening
Move 2: Computer takes a corner (e.g., position 0)
Move 3: You take opposite corner (position 8)
Move 4: Computer blocks your potential wins
Move 5-9: Both players block threats
Result: Draw (guaranteed)
```

**Example Matches**:
- Win rate: 0% (impossible to win)
- Draw rate: 95%+ (with perfect play)
- Loss rate: 5% (only if you blunder badly)
- Challenge factor: Maximum

---

## Tips for Each Difficulty

### Beating Easy Mode ✓
1. Get any 3 in a row (horizontal, vertical, or diagonal)
2. Don't worry about blocking
3. Any basic pattern works
4. Great for learning the game!

### Beating Medium Mode ✓
1. **Control the center** - worth 4 possible lines
2. **Play defense first** - block 2-in-a-row threats
3. **Set up forks** - create two ways to win
4. **Take corners** - more powerful than edges
5. **Plan ahead** - think 2-3 moves in advance
6. **Stay patient** - most games are draws if AI blocks well

### Drawing Against Hard Mode ✓
1. **Take center on first move** - best starting position
2. **Play perfectly** - every mistake might cost the game
3. **Block immediately** - don't wait for next turn
4. **Focus on defense** - protecting is more important than attacking
5. **Avoid creating threats** - don't give AI winning options
6. **Learn opening theory** - study proven tic-tac-toe openings
7. **Accept draws** - a draw is actually a great result!

---

## Game Board Positions

The board uses these position numbers:

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

### Strategic Value
- **Position 4 (Center)**: Highest value - involved in 4 lines
- **Positions 0, 2, 6, 8 (Corners)**: High value - involved in 3 lines
- **Positions 1, 3, 5, 7 (Edges)**: Lower value - involved in 2 lines

### Winning Lines (8 total)
```
Horizontal: [0,1,2] [3,4,5] [6,7,8]
Vertical:   [0,3,6] [1,4,7] [2,5,8]
Diagonal:   [0,4,8] [2,4,6]
```

---

## What Happens During the Game

### Your Turn
1. Board is interactive (clickable)
2. Your player card is highlighted blue
3. You can place X anywhere empty
4. Computer waits for your move

### Computer's Turn
1. Board is disabled (not clickable)
2. "🤖 Computer is thinking..." appears
3. 600ms natural thinking delay
4. O appears with animation
5. Board updates automatically

### Game End
1. **Win**: Trophy animation, confetti, victory banner
2. **Loss**: Shake effect, sad faces, defeat banner
3. **Draw**: Handshake animation, friendly message

### After Game Ends
1. "Play Again" button becomes prominent
2. Your stats update in the player cards
3. Leaderboard refreshes with new rankings
4. You can start another game immediately

---

## Tracking Your Progress

### Player Statistics
Each player card shows:
- **Wins**: How many games you've won
- **Losses**: How many games you've lost
- **Draws**: How many games ended in draws
- **Total**: Total games played (Wins + Losses + Draws)

### Leaderboard
The right sidebar shows:
- **Your ranking** among all players
- **Win rate %** calculated as (Wins / Total) × 100
- **Badge** indicating your rank position

### Statistics Examples
- **5 wins, 2 losses, 1 draw** = 8 total games
  - Win rate: 5/8 = 62.5%
- **3 wins, 10 losses, 2 draws** = 15 total games
  - Win rate: 3/15 = 20%
- **0 wins, 0 losses, 5 draws** = 5 total games
  - Win rate: 0/5 = 0% (all draws!)

---

## Changing Difficulty Mid-Session

### How to Change
1. Click a different difficulty level
2. Current game resets automatically
3. Next game uses the new difficulty
4. Your stats from previous difficulty still count

### Strategy
- **Start with Easy** to learn the rules
- **Move to Medium** once comfortable
- **Challenge Hard** when ready for a real test
- **Mix difficulties** to practice different skills

---

## Switching Back to Player vs Player

### How to Switch
1. Click **"👥 Player vs Player"** button
2. Game resets to two-player mode
3. Difficulty selector disappears
4. Both players are human

### Computer Stats Preserved
- Computer's statistics remain on the leaderboard
- Your wins/losses against Computer are saved
- You can compare performance against both humans and AI

---

## Advanced Tips

### Opening Theory
Best first moves for you (X):
1. **Corner** (0, 2, 6, or 8) - Solid choice
2. **Center** (4) - Best option, controls the board

Worst first move:
- **Edge** (1, 3, 5, 7) - Rarely optimal

### Common Mistakes to Avoid
1. **Taking edges early** - Less strategic value
2. **Not blocking threats** - Let opponent complete 3-in-a-row
3. **Creating weak positions** - Limits your winning paths
4. **Ignoring the center** - Most valuable position

### Winning Positions
A fork is when you have 2 winning threats at once:
```
Example fork:
X | O | X
---------  
  | X | 
---------
  |   | O

Computer can only block one threat!
```

---

## FAQ

**Q: Can I beat the Hard AI?**
A: No, not consistently. Hard mode uses perfect play. Your best result is a draw with optimal play.

**Q: Why does the computer sometimes make weird moves in Medium mode?**
A: Medium mode is 50% random by design. This makes it more unpredictable and fun to play!

**Q: Does the computer cheat?**
A: No! It only looks at the current board state and legal moves. No hidden advantages.

**Q: What if I want to play against a friend again?**
A: Click "Player vs Player" to switch back to two-player mode.

**Q: Does my score against the computer count?**
A: Yes! All games (PvP and AI) are tracked in your statistics and leaderboard ranking.

**Q: Can I rename the computer?**
A: No, the computer always shows as "Computer" in AI mode. Only human players in PvP can be renamed.

**Q: Is there a time limit for my move?**
A: No, take as long as you want! Click when ready.

**Q: What's the computer's thinking delay for?**
A: The 600ms delay makes it feel more natural and less instant. It simulates thinking time.

---

## Improving Your Skills

### Progression Path
1. **Week 1**: Play Easy mode, learn the rules
2. **Week 2**: Play Medium mode, develop strategy
3. **Week 3**: Practice Hard mode, aim for draws
4. **Week 4+**: Master the game, achieve consistent draws!

### Practice Exercises
- **Defensive drill**: Play Hard mode, focus only on blocking
- **Offensive drill**: Try to win against Medium mode
- **Fork drill**: Practice creating two-way wins
- **Endgame drill**: Master the last 3 moves

### Study Resources
- Learn the "perfect game" strategy
- Study famous tic-tac-toe matches
- Practice opening positions
- Memorize fork opportunities

---

## Enjoying the Game

### For Fun
- Play Easy mode to relax
- Try Medium mode for casual fun
- Enjoy the animations and celebrations

### For Challenge
- Master Hard mode
- Achieve consistent draws
- Compete with your own stats
- Challenge yourself to improve win rate vs Medium

### For Learning
- Understand game theory
- Learn strategic thinking
- Practice pattern recognition
- Develop planning skills

---

🎮 **Ready to challenge the computer?** 🎮

Start with Easy mode, work your way up to Hard, and see if you can achieve the perfect game! Good luck! 🍀

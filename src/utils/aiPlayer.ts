/**
 * AI Player for Tic Tac Toe
 * Uses minimax algorithm with difficulty levels
 * Optimized for multiple board sizes
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  difficulty: Difficulty;
  boardSize: number;
  winLength: number; // Number of marks needed to win

  constructor(difficulty: Difficulty = 'hard', boardSize: number = 3) {
    this.difficulty = difficulty;
    this.boardSize = boardSize;
    this.winLength = boardSize; // For NxN board, need N in a row
  }

  /**
   * Get the best move for the AI
   */
  getMove(board: (string | null)[]): number {
    if (this.difficulty === 'easy') {
      return this.getRandomMove(board);
    } else if (this.difficulty === 'medium') {
      return this.getMediumMove(board);
    } else {
      return this.getHardMove(board);
    }
  }

  /**
   * Easy mode: Random valid move
   */
  private getRandomMove(board: (string | null)[]): number {
    const emptySquares = board
      .map((square, index) => (square === null ? index : null))
      .filter((index) => index !== null) as number[];

    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }

  /**
   * Medium mode: Mix of smart and random moves
   */
  private getMediumMove(board: (string | null)[]): number {
    // 60% chance of smart move, 40% chance of random
    if (Math.random() < 0.6) {
      const smartMove = this.findSmartMove(board);
      if (smartMove !== -1) return smartMove;
    }
    return this.getRandomMove(board);
  }

  /**
   * Hard mode: Minimax algorithm for 3x3, Smart heuristics for larger boards
   */
  private getHardMove(board: (string | null)[]): number {
    // For 3x3, use full minimax
    if (this.boardSize === 3) {
      let bestScore = -Infinity;
      let bestIndex = 0;

      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          const testBoard = [...board];
          testBoard[i] = 'O';
          const score = this.minimax(testBoard, 0, false);
          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }
      }
      return bestIndex;
    }

    // For larger boards, use advanced heuristics
    return this.findSmartMoveAdvanced(board);
  }

  /**
   * Advanced smart move strategy for larger boards
   */
  private findSmartMoveAdvanced(board: (string | null)[]): number {
    // 1. Try to win immediately
    const winMove = this.findWinningMoveAdvanced(board, 'O');
    if (winMove !== -1) return winMove;

    // 2. Block opponent's immediate win
    const blockMove = this.findWinningMoveAdvanced(board, 'X');
    if (blockMove !== -1) return blockMove;

    // 3. Create/extend winning threats (sequences of 2+)
    const threatMove = this.findThreatMove(board, 'O');
    if (threatMove !== -1) return threatMove;

    // 4. Block opponent's threats
    const blockThreatMove = this.findThreatMove(board, 'X');
    if (blockThreatMove !== -1) return blockThreatMove;

    // 5. Take center area (better control)
    const centerMove = this.findCenterMove(board);
    if (centerMove !== -1) return centerMove;

    // 6. Create multi-threat opportunities (forks)
    const forkMove = this.findForkMove(board, 'O');
    if (forkMove !== -1) return forkMove;

    // 7. Block opponent forks
    const blockForkMove = this.findForkMove(board, 'X');
    if (blockForkMove !== -1) return blockForkMove;

    // 8. Random move
    return this.getRandomMove(board);
  }

  /**
   * Find a winning move (need winLength marks in a row)
   */
  private findWinningMoveAdvanced(board: (string | null)[], player: string): number {
    const lines = this.getAllWinningLines();

    for (const line of lines) {
      const values = line.map((i) => board[i]);
      const playerCount = values.filter((v) => v === player).length;
      const emptyCount = values.filter((v) => v === null).length;

      // If player has (winLength - 1) marks and 1 empty spot, they can win
      if (playerCount === this.winLength - 1 && emptyCount === 1) {
        const emptyIndex = line[values.indexOf(null)];
        return emptyIndex;
      }
    }

    return -1;
  }

  /**
   * Find a move that creates or extends a threat (2+ in a row)
   */
  private findThreatMove(board: (string | null)[], player: string): number {
    const lines = this.getAllWinningLines();
    const threatMoves: { index: number; score: number }[] = [];

    for (const line of lines) {
      const values = line.map((i) => board[i]);
      const playerCount = values.filter((v) => v === player).length;
      const emptyCount = values.filter((v) => v === null).length;
      const opponentCount = values.filter((v) => v !== null && v !== player).length;

      // Favor moves that create threats (2+ of player's marks)
      if (playerCount >= 1 && opponentCount === 0 && emptyCount > 0) {
        for (let i = 0; i < line.length; i++) {
          if (board[line[i]] === null) {
            const existingScore = threatMoves.find((m) => m.index === line[i])?.score || 0;
            // Score based on how many player marks are in this line
            const score = playerCount * 2 + emptyCount;
            threatMoves.push({
              index: line[i],
              score: Math.max(existingScore, score),
            });
          }
        }
      }
    }

    if (threatMoves.length > 0) {
      threatMoves.sort((a, b) => b.score - a.score);
      return threatMoves[0].index;
    }

    return -1;
  }

  /**
   * Find a move that creates a fork opportunity (multiple winning threats)
   */
  private findForkMove(board: (string | null)[], player: string): number {
    const emptySquares = board
      .map((_, i) => (board[i] === null ? i : null))
      .filter((i) => i !== null) as number[];

    // For each empty square, simulate the move and count threats
    let bestMove = -1;
    let maxThreats = 0;

    for (const squareIndex of emptySquares) {
      const testBoard = [...board];
      testBoard[squareIndex] = player;

      let threatCount = 0;
      const lines = this.getAllWinningLines();

      for (const line of lines) {
        const values = line.map((i) => testBoard[i]);
        const playerCount = values.filter((v) => v === player).length;
        const emptyCount = values.filter((v) => v === null).length;
        const opponentCount = values.filter((v) => v !== null && v !== player).length;

        // Count as threat if player has (winLength - 1) and empty spots
        if (
          playerCount === this.winLength - 1 &&
          emptyCount > 0 &&
          opponentCount === 0
        ) {
          threatCount++;
        }
      }

      if (threatCount > maxThreats) {
        maxThreats = threatCount;
        bestMove = squareIndex;
      }
    }

    return maxThreats >= 2 ? bestMove : -1;
  }

  /**
   * Find moves near center (better board control)
   */
  private findCenterMove(board: (string | null)[]): number {
    const centerArea: number[] = [];

    // Build center area with increasing distance
    for (let distance = 0; distance < this.boardSize; distance++) {
      for (let i = 0; i < board.length; i++) {
        const row = Math.floor(i / this.boardSize);
        const col = i % this.boardSize;
        const centerRow = Math.floor(this.boardSize / 2);
        const centerCol = Math.floor(this.boardSize / 2);

        const distToCenter = Math.max(
          Math.abs(row - centerRow),
          Math.abs(col - centerCol)
        );

        if (distToCenter === distance && board[i] === null) {
          centerArea.push(i);
        }
      }
    }

    return centerArea.length > 0
      ? centerArea[Math.floor(Math.random() * centerArea.length)]
      : -1;
  }

  /**
   * Basic smart move for 3x3 board
   */
  private findSmartMove(board: (string | null)[]): number {
    // Try to win
    const winMove = this.findWinningMove(board, 'O');
    if (winMove !== -1) return winMove;

    // Block opponent from winning
    const blockMove = this.findWinningMove(board, 'X');
    if (blockMove !== -1) return blockMove;

    // Take center if available
    if (board[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((i) => board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter((i) => board[i] === null);
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    return -1;
  }

  /**
   * Find a winning move for 3x3 board
   */
  private findWinningMove(board: (string | null)[], player: string): number {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const values = [board[a], board[b], board[c]];
      const emptyCount = values.filter((v) => v === null).length;
      const playerCount = values.filter((v) => v === player).length;

      if (playerCount === 2 && emptyCount === 1) {
        const emptyIndex = [a, b, c][values.indexOf(null)];
        return emptyIndex;
      }
    }

    return -1;
  }

  /**
   * Get all possible winning lines for current board size
   */
  private getAllWinningLines(): number[][] {
    const lines: number[][] = [];

    // Horizontal lines
    for (let row = 0; row < this.boardSize; row++) {
      const line: number[] = [];
      for (let col = 0; col < this.boardSize; col++) {
        line.push(row * this.boardSize + col);
      }
      lines.push(line);
    }

    // Vertical lines
    for (let col = 0; col < this.boardSize; col++) {
      const line: number[] = [];
      for (let row = 0; row < this.boardSize; row++) {
        line.push(row * this.boardSize + col);
      }
      lines.push(line);
    }

    // Diagonal (top-left to bottom-right)
    const diag1: number[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      diag1.push(i * this.boardSize + i);
    }
    lines.push(diag1);

    // Diagonal (top-right to bottom-left)
    const diag2: number[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      diag2.push(i * this.boardSize + (this.boardSize - 1 - i));
    }
    lines.push(diag2);

    return lines;
  }

  /**
   * Minimax algorithm for 3x3 board only
   */
  private minimax(board: (string | null)[], depth: number, isMaximizing: boolean): number {
    const winner = this.calculateWinner(board);

    // Terminal states
    if (winner === 'O') return 10 - depth; // AI wins
    if (winner === 'X') return depth - 10; // Player wins
    if (board.every((square) => square !== null)) return 0; // Draw

    if (isMaximizing) {
      // AI's turn (O)
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          const testBoard = [...board];
          testBoard[i] = 'O';
          const score = this.minimax(testBoard, depth + 1, false);
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      // Player's turn (X)
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          const testBoard = [...board];
          testBoard[i] = 'X';
          const score = this.minimax(testBoard, depth + 1, true);
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  /**
   * Check for winner (3x3 only)
   */
  private calculateWinner(board: (string | null)[]): string | null {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }
}

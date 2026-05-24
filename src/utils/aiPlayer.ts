/**
 * AI Player for Tic Tac Toe (Gomoku-style for larger boards).
 *
 * Win condition matches TicTacToe.tsx:
 *   - 3x3 boards require 3 in a row
 *   - All larger boards require 4 in a row
 *
 * Hard mode uses depth-limited minimax with alpha-beta pruning,
 * candidate-move filtering, and a threat-weighted heuristic.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

const AI = 'O';
const HUMAN = 'X';

export class AIPlayer {
  difficulty: Difficulty;
  boardSize: number;
  winLength: number;
  private cachedLines: number[][] | null = null;

  constructor(difficulty: Difficulty = 'hard', boardSize: number = 3) {
    this.difficulty = difficulty;
    this.boardSize = boardSize;
    // Must match TicTacToe.getWinLength: 3 for 3x3, 4 for everything bigger.
    this.winLength = boardSize === 3 ? 3 : 4;
  }

  getMove(board: (string | null)[]): number {
    if (this.difficulty === 'easy') return this.getRandomMove(board);
    if (this.difficulty === 'medium') return this.getMediumMove(board);
    return this.getHardMove(board);
  }

  // ---------- Easy ----------
  private getRandomMove(board: (string | null)[]): number {
    const empties = this.emptyIndices(board);
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // ---------- Medium ----------
  private getMediumMove(board: (string | null)[]): number {
    // Always grab immediate wins / blocks; otherwise occasionally slip.
    const win = this.findImmediateWin(board, AI);
    if (win !== -1) return win;
    const block = this.findImmediateWin(board, HUMAN);
    if (block !== -1) return block;

    if (Math.random() < 0.6) {
      return this.bestPositionalMove(board);
    }
    return this.getRandomMove(board);
  }

  // ---------- Hard ----------
  private getHardMove(board: (string | null)[]): number {
    // First move: take center (or near it).
    if (board.every((c) => c === null)) {
      const c = Math.floor(this.boardSize / 2);
      return c * this.boardSize + c;
    }

    // 1. Win immediately if possible.
    const win = this.findImmediateWin(board, AI);
    if (win !== -1) return win;

    // 2. Block opponent's immediate win.
    const block = this.findImmediateWin(board, HUMAN);
    if (block !== -1) return block;

    // 3. Create a fork (≥2 immediate winning threats).
    const fork = this.findFork(board, AI);
    if (fork !== -1) return fork;

    // 4. Block opponent's fork.
    const blockFork = this.findFork(board, HUMAN);
    if (blockFork !== -1) return blockFork;

    // 5. For 3x3, fall back to perfect minimax.
    if (this.boardSize === 3) {
      return this.perfectMinimaxMove(board);
    }

    // 6. Depth-limited alpha-beta minimax on candidate moves.
    return this.searchBestMove(board);
  }

  // ---------- Core search ----------

  /** Choose search depth based on board size. */
  private get maxDepth(): number {
    if (this.boardSize <= 4) return 5;
    if (this.boardSize === 5) return 4;
    return 3;
  }

  private searchBestMove(board: (string | null)[]): number {
    const candidates = this.orderedCandidateMoves(board, AI);
    let bestScore = -Infinity;
    let bestMoves: number[] = [];

    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of candidates) {
      const next = board.slice();
      next[move] = AI;
      const score = this.minimax(next, this.maxDepth - 1, alpha, beta, false);

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
      alpha = Math.max(alpha, bestScore);
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  private minimax(
    board: (string | null)[],
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean,
  ): number {
    const terminal = this.terminalScore(board, depth);
    if (terminal !== null) return terminal;
    if (depth === 0) return this.evaluate(board);

    const player = maximizing ? AI : HUMAN;
    const candidates = this.orderedCandidateMoves(board, player);

    if (candidates.length === 0) return this.evaluate(board);

    if (maximizing) {
      let value = -Infinity;
      for (const move of candidates) {
        const next = board.slice();
        next[move] = AI;
        value = Math.max(value, this.minimax(next, depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return value;
    } else {
      let value = Infinity;
      for (const move of candidates) {
        const next = board.slice();
        next[move] = HUMAN;
        value = Math.min(value, this.minimax(next, depth - 1, alpha, beta, true));
        beta = Math.min(beta, value);
        if (alpha >= beta) break;
      }
      return value;
    }
  }

  /** Returns a terminal score if the board is decided; otherwise null. */
  private terminalScore(board: (string | null)[], depthLeft: number): number | null {
    const winner = this.checkWinner(board);
    if (winner === AI) return 100000 + depthLeft; // prefer faster wins
    if (winner === HUMAN) return -100000 - depthLeft; // prefer later losses
    if (board.every((c) => c !== null)) return 0;
    return null;
  }

  // ---------- Candidate moves ----------

  /**
   * Only consider empty cells within a small radius of existing marks.
   * Heavily prunes the branching factor on larger boards.
   */
  private candidateMoves(board: (string | null)[]): number[] {
    const N = this.boardSize;
    const radius = 2;
    const seen = new Set<number>();

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) continue;
      const r = Math.floor(i / N);
      const c = i % N;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          const idx = nr * N + nc;
          if (board[idx] === null) seen.add(idx);
        }
      }
    }

    if (seen.size === 0) {
      const c = Math.floor(N / 2);
      return [c * N + c];
    }
    return Array.from(seen);
  }

  /** Heuristically order moves to improve alpha-beta pruning. */
  private orderedCandidateMoves(board: (string | null)[], player: string): number[] {
    const opponent = player === AI ? HUMAN : AI;
    const candidates = this.candidateMoves(board);

    const scored = candidates.map((move) => {
      const next = board.slice();
      next[move] = player;
      const own = this.evaluateForPlayer(next, player);
      const oppBoard = board.slice();
      oppBoard[move] = opponent;
      const opp = this.evaluateForPlayer(oppBoard, opponent);
      return { move, score: own + opp * 0.9 };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.move);
  }

  // ---------- Threat / fork detection ----------

  /** Find an empty cell that completes a winLength-in-a-row for `player`. */
  private findImmediateWin(board: (string | null)[], player: string): number {
    const lines = this.getAllWinningLines();
    for (const line of lines) {
      let playerCount = 0;
      let emptyIndex = -1;
      let opponentCount = 0;
      for (const i of line) {
        const v = board[i];
        if (v === player) playerCount++;
        else if (v === null) emptyIndex = i;
        else opponentCount++;
      }
      if (playerCount === this.winLength - 1 && opponentCount === 0 && emptyIndex !== -1) {
        return emptyIndex;
      }
    }
    return -1;
  }

  /**
   * Find a move that creates ≥2 simultaneous immediate-win threats.
   * Opponent can only block one → guaranteed win next turn.
   */
  private findFork(board: (string | null)[], player: string): number {
    const candidates = this.candidateMoves(board);
    let bestMove = -1;
    let bestThreatCount = 1; // need 2+ to be a fork

    for (const move of candidates) {
      if (board[move] !== null) continue;
      const next = board.slice();
      next[move] = player;

      // If this move also wins outright, immediate-win check would have caught it.
      // Count distinct cells where the opponent would need to block.
      const winningSpots = new Set<number>();
      const lines = this.getAllWinningLines();
      for (const line of lines) {
        let playerCount = 0;
        let emptyIndex = -1;
        let opponentCount = 0;
        for (const i of line) {
          const v = next[i];
          if (v === player) playerCount++;
          else if (v === null) {
            if (emptyIndex === -1) emptyIndex = i;
            else { emptyIndex = -2; break; } // more than one empty
          } else opponentCount++;
        }
        if (
          playerCount === this.winLength - 1 &&
          opponentCount === 0 &&
          emptyIndex >= 0
        ) {
          winningSpots.add(emptyIndex);
        }
      }

      if (winningSpots.size > bestThreatCount) {
        bestThreatCount = winningSpots.size;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // ---------- Evaluation ----------

  /** Net heuristic from AI's perspective. */
  private evaluate(board: (string | null)[]): number {
    return this.evaluateForPlayer(board, AI) - this.evaluateForPlayer(board, HUMAN);
  }

  /**
   * Sum of line scores for `player`. A line is alive only if it has no
   * opponent marks. Score scales exponentially with mark count so that
   * (winLength - 1) marks dominate (winLength - 2), etc.
   */
  private evaluateForPlayer(board: (string | null)[], player: string): number {
    const opponent = player === AI ? HUMAN : AI;
    const lines = this.getAllWinningLines();
    let score = 0;

    for (const line of lines) {
      let playerCount = 0;
      let opponentCount = 0;
      for (const i of line) {
        if (board[i] === player) playerCount++;
        else if (board[i] === opponent) opponentCount++;
      }
      if (opponentCount > 0) continue; // dead line
      if (playerCount === 0) continue;

      // Exponential weighting: 1 mark = 1, 2 = 10, 3 = 100, ...
      score += Math.pow(10, playerCount - 1);
    }

    return score;
  }

  // ---------- Lines & winner ----------

  /**
   * All consecutive winLength-cell sequences (rows, cols, both diagonals).
   * Matches generateWinningLines in TicTacToe.tsx.
   */
  private getAllWinningLines(): number[][] {
    if (this.cachedLines) return this.cachedLines;

    const lines: number[][] = [];
    const N = this.boardSize;
    const W = this.winLength;

    // Horizontal
    for (let row = 0; row < N; row++) {
      for (let col = 0; col <= N - W; col++) {
        const line: number[] = [];
        for (let i = 0; i < W; i++) line.push(row * N + col + i);
        lines.push(line);
      }
    }
    // Vertical
    for (let col = 0; col < N; col++) {
      for (let row = 0; row <= N - W; row++) {
        const line: number[] = [];
        for (let i = 0; i < W; i++) line.push((row + i) * N + col);
        lines.push(line);
      }
    }
    // Diagonal ↘
    for (let row = 0; row <= N - W; row++) {
      for (let col = 0; col <= N - W; col++) {
        const line: number[] = [];
        for (let i = 0; i < W; i++) line.push((row + i) * N + col + i);
        lines.push(line);
      }
    }
    // Diagonal ↙
    for (let row = 0; row <= N - W; row++) {
      for (let col = W - 1; col < N; col++) {
        const line: number[] = [];
        for (let i = 0; i < W; i++) line.push((row + i) * N + col - i);
        lines.push(line);
      }
    }

    this.cachedLines = lines;
    return lines;
  }

  private checkWinner(board: (string | null)[]): string | null {
    const lines = this.getAllWinningLines();
    for (const line of lines) {
      const first = board[line[0]];
      if (!first) continue;
      if (line.every((i) => board[i] === first)) return first;
    }
    return null;
  }

  private emptyIndices(board: (string | null)[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) result.push(i);
    }
    return result;
  }

  /** Heuristic fallback used by medium mode and as a tiebreaker. */
  private bestPositionalMove(board: (string | null)[]): number {
    const candidates = this.candidateMoves(board);
    if (candidates.length === 0) return this.getRandomMove(board);

    let bestScore = -Infinity;
    let bestMoves: number[] = [];

    for (const move of candidates) {
      const next = board.slice();
      next[move] = AI;
      const offense = this.evaluateForPlayer(next, AI);

      const defBoard = board.slice();
      defBoard[move] = HUMAN;
      const defense = this.evaluateForPlayer(defBoard, HUMAN);

      const score = offense + defense * 0.9;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // ---------- 3x3 perfect play ----------

  private perfectMinimaxMove(board: (string | null)[]): number {
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < board.length; i++) {
      if (board[i] !== null) continue;
      const next = board.slice();
      next[i] = AI;
      const score = this.perfectMinimax(next, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  }

  private perfectMinimax(
    board: (string | null)[],
    depth: number,
    maximizing: boolean,
  ): number {
    const winner = this.checkWinner(board);
    if (winner === AI) return 10 - depth;
    if (winner === HUMAN) return depth - 10;
    if (board.every((c) => c !== null)) return 0;

    if (maximizing) {
      let best = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] !== null) continue;
        const next = board.slice();
        next[i] = AI;
        best = Math.max(best, this.perfectMinimax(next, depth + 1, false));
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] !== null) continue;
        const next = board.slice();
        next[i] = HUMAN;
        best = Math.min(best, this.perfectMinimax(next, depth + 1, true));
      }
      return best;
    }
  }
}

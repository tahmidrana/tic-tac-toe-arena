export function getWinLength(size: number): number {
  return size === 3 ? 3 : 4;
}

export function generateWinningLines(size: number): number[][] {
  const winLength = getWinLength(size);
  const lines: number[][] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const line: number[] = [];
      for (let i = 0; i < winLength; i++) line.push(row * size + col + i);
      lines.push(line);
    }
  }
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const line: number[] = [];
      for (let i = 0; i < winLength; i++) line.push((row + i) * size + col);
      lines.push(line);
    }
  }
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line: number[] = [];
      for (let i = 0; i < winLength; i++) line.push((r + i) * size + (c + i));
      lines.push(line);
    }
  }
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      const line: number[] = [];
      for (let i = 0; i < winLength; i++) line.push((r + i) * size + (c - i));
      lines.push(line);
    }
  }
  return lines;
}

export function calculateWinner(
  squares: (string | null)[],
  size: number,
): { winner: string | null; line: number[] | null } {
  const lines = generateWinningLines(size);
  for (const line of lines) {
    const first = squares[line[0]];
    if (first && line.every((i) => squares[i] === first)) {
      return { winner: first, line };
    }
  }
  return { winner: null, line: null };
}

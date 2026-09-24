import { applyMove, DEFAULT_RULES, legalMoves, other, type Board, type Move, type Side } from './engine';

/**
 * Exact forced-win search used by the puzzle mode.
 * Returns true if `attacker` can force a win (opponent without pieces or legal moves)
 * within `plies` half-moves, with `toMove` to play.
 */
export function canForceWin(board: Board, attacker: Side, toMove: Side, plies: number): boolean {
  const moves = legalMoves(board, toMove, DEFAULT_RULES);
  if (moves.length === 0) return toMove !== attacker;
  if (plies <= 0) return false;
  const next = other(toMove);
  if (toMove === attacker) {
    for (const m of moves) if (canForceWin(applyMove(board, m), attacker, next, plies - 1)) return true;
    return false;
  }
  for (const m of moves) if (!canForceWin(applyMove(board, m), attacker, next, plies - 1)) return false;
  return true;
}

/** Fewest attacker moves (<= max) needed to force a win with the attacker to move. */
export function winDistance(board: Board, attacker: Side, max: number): number {
  for (let n = 1; n <= max; n++) if (canForceWin(board, attacker, attacker, 2 * n - 1)) return n;
  return Infinity;
}

/** Attacker moves that still force a win within `movesLeft` attacker moves (this one included). */
export function winningMoves(board: Board, attacker: Side, movesLeft: number): Move[] {
  return legalMoves(board, attacker, DEFAULT_RULES).filter((m) =>
    canForceWin(applyMove(board, m), attacker, other(attacker), 2 * (movesLeft - 1)),
  );
}

/** Does the defender (to move) survive past `attackerMovesLeft` attacker moves? */
export function defenderEscapes(board: Board, attacker: Side, attackerMovesLeft: number): boolean {
  return !canForceWin(board, attacker, other(attacker), 2 * attackerMovesLeft);
}

/** The defender reply that resists the longest (or escapes if it can). */
export function bestDefense(board: Board, attacker: Side, attackerMovesLeft: number): Move | null {
  const defender = other(attacker);
  const moves = legalMoves(board, defender, DEFAULT_RULES);
  if (!moves.length) return null;
  let best = moves[0];
  let bestLen = -1;
  for (const m of moves) {
    const after = applyMove(board, m);
    const len = winDistance(after, attacker, attackerMovesLeft);
    if (len > bestLen) {
      bestLen = len;
      best = m;
      if (len === Infinity) break;
    }
  }
  return best;
}

export function maxCaptureCount(board: Board, side: Side): number {
  let max = 0;
  for (const m of legalMoves(board, side, DEFAULT_RULES)) if (m.captures.length > max) max = m.captures.length;
  return max;
}

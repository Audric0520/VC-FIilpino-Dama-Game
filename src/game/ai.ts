import {
  allDamaPosition,
  applyMove,
  DARK_SQUARES,
  DEFAULT_RULES,
  legalMoves,
  other,
  RAYS,
  type Board,
  type Move,
  type Rules,
  type Side,
} from './engine';

export type Level = 'easy' | 'medium' | 'hard';

interface LevelConfig {
  maxDepth: number;
  timeMs: number;
  /** Random noise (in centi-pieces) added to root scores. */
  noise: number;
  /** Probability of playing a completely random legal move. */
  blunder: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  easy: { maxDepth: 2, timeMs: 250, noise: 70, blunder: 0.3 },
  medium: { maxDepth: 4, timeMs: 650, noise: 14, blunder: 0.04 },
  hard: { maxDepth: 24, timeMs: 1400, noise: 0, blunder: 0 },
};

const WIN = 1_000_000;
const MAX_PLY = 48;
const MAN = 100;
const KING = 320;
/** Bonus by number of rows a man has advanced from its home row. */
const ADV = [0, 2, 4, 7, 11, 17, 26, 0];
const CENTER = [0, 2, 4, 6, 6, 4, 2, 0];

function kingMobility(b: Board, sq: number): number {
  let n = 0;
  const rays = RAYS[sq];
  for (let d = 0; d < 4; d++) {
    const ray = rays[d];
    for (let k = 0; k < ray.length; k++) {
      if (b[ray[k]] !== 0) break;
      n++;
    }
  }
  return n;
}

/** Static evaluation from Player 1's point of view. */
export function evaluate(b: Board): number {
  let score = 0;
  let p1 = 0;
  let p2 = 0;
  let p1Men = 0;
  let p2Men = 0;
  for (let i = 0; i < DARK_SQUARES.length; i++) {
    const sq = DARK_SQUARES[i];
    const v = b[sq];
    if (v === 0) continue;
    const r = sq >> 3;
    const c = sq & 7;
    if (v === 1) {
      p1++;
      p1Men++;
      score += MAN + ADV[7 - r] + (r >= 2 && r <= 5 ? CENTER[c] : 0) + (r === 7 ? 6 : 0);
    } else if (v === -1) {
      p2++;
      p2Men++;
      score -= MAN + ADV[r] + (r >= 2 && r <= 5 ? CENTER[c] : 0) + (r === 0 ? 6 : 0);
    } else if (v === 2) {
      p1++;
      score += KING + kingMobility(b, sq) * 2 + (r === c ? 12 : 0);
    } else {
      p2++;
      score -= KING + kingMobility(b, sq) * 2 + (r === c ? 12 : 0);
    }
  }
  // Encourage trades when ahead (and avoid them when behind).
  if (p1 !== p2) score += (p1 > p2 ? 1 : -1) * (24 - p1 - p2) * 4;
  // Men that are still able to promote are worth keeping in the endgame.
  if (p1Men === 0 && p2Men === 0 && Math.abs(p1 - p2) <= 1) score = Math.round(score * 0.5);
  return score;
}

const TIMEOUT = { timeout: true };

interface Ctx {
  deadline: number;
  nodes: number;
  rules: Rules;
}

function orderMoves(moves: Move[]): Move[] {
  return moves
    .slice()
    .sort(
      (a, b) =>
        b.captures.length - a.captures.length || (b.promotes ? 1 : 0) - (a.promotes ? 1 : 0),
    );
}

function negamax(ctx: Ctx, b: Board, side: Side, depth: number, alpha: number, beta: number, ply: number): number {
  if ((++ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) throw TIMEOUT;
  // Tournament rule: a position where every piece is a Dama is an immediate draw.
  if (ctx.rules.allDamaDraw && allDamaPosition(b)) return 0;
  const moves = legalMoves(b, side, ctx.rules);
  if (moves.length === 0) return -WIN + ply;
  const sign = side === 1 ? 1 : -1;
  const capturing = moves[0].captures.length > 0;
  if (ply >= MAX_PLY || (depth <= 0 && !capturing)) return sign * evaluate(b);

  // Forced captures are resolved (quiescence); single replies do not consume depth.
  const nextDepth = depth <= 0 ? 0 : moves.length === 1 ? depth : depth - 1;
  const ordered = moves.length > 1 ? orderMoves(moves) : moves;
  let best = -Infinity;
  const opp = other(side);
  for (const m of ordered) {
    const s = -negamax(ctx, applyMove(b, m), opp, nextDepth, -beta, -alpha, ply + 1);
    if (s > best) best = s;
    if (s > alpha) alpha = s;
    if (alpha >= beta) break;
  }
  return best;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface AIRequest {
  board: Board;
  side: Side;
  level: Level;
  rules?: Rules;
  timeMs?: number;
}

// --- Position analysis (evaluation bar) -------------------------------------

export interface AnalysisRequest {
  board: Board;
  /** Side to move; the score is reported from this side's point of view. */
  side: Side;
  rules?: Rules;
  /** Optional search budget override in milliseconds. */
  timeMs?: number;
}

export interface PositionAnalysis {
  /** Search score in centi-pieces from the side-to-move's perspective. */
  cp: number;
  /** 0-100: the side to move's winning chances in percent. */
  winPercent: number;
  /** 1 = P1 (White), 2 = P2 (Black). */
  side: Side;
  depth: number;
  nodes: number;
  /** True when the search found a forced win/loss/draw. */
  decisive: boolean;
}

const EVAL_TIME_MS = 600;

/** Map a centi-piece score to a 0-100 winning-chance percentage. */
export function evalPercent(cp: number): number {
  if (cp >= WIN / 2) return 100;
  if (cp <= -WIN / 2) return 0;
  const p = 100 / (1 + Math.exp(-cp / 210));
  return Math.min(100, Math.max(0, Math.round(p * 10) / 10));
}

/** Human-readable formatting of a centi-piece score. */
export function formatEvalCp(cp: number): string {
  if (cp >= WIN / 2) return '#win';
  if (cp <= -WIN / 2) return '#loss';
  const sign = cp > 0 ? '+' : cp < 0 ? '−' : '';
  return `${sign}${(Math.abs(cp) / 100).toFixed(1)}`;
}

/**
 * Analyse a position and return a score + win percentage from the side to
 * move's point of view. Runs a full-width negamax search using the same
 * evaluation the engine plays with.
 */
export function analyzePosition({ board, side, rules = DEFAULT_RULES, timeMs = EVAL_TIME_MS }: AnalysisRequest): PositionAnalysis {
  const moves = legalMoves(board, side, rules);
  const deadline = Date.now() + timeMs;
  let nodes = 0;
  let depthReached = 0;

  if (moves.length === 0) {
    return { cp: -WIN, winPercent: 0, side, depth: 0, nodes: 0, decisive: true };
  }

  const ctx: Ctx = { deadline, nodes: 0, rules };
  const opp = other(side);
  let rootMoves = orderMoves(moves.slice());
  let alpha = -Infinity;
  let decisive = false;

  for (let depth = 1; depth <= MAX_PLY; depth++) {
    try {
      const scored: { m: Move; s: number }[] = [];
      let bestHere = -Infinity;
      let window = -Infinity;
      for (const m of rootMoves) {
        const child = applyMove(board, m);
        const s = -negamax(ctx, child, opp, depth - 1, -Infinity, -window, 1);
        if (s > bestHere) bestHere = s;
        if (s > window) window = s;
        scored.push({ m, s });
      }
      alpha = bestHere;
      scored.sort((a, b) => b.s - a.s);
      rootMoves = scored.map((x) => x.m);
      depthReached = depth;
      nodes = ctx.nodes;
      if (Math.abs(alpha) > WIN / 2) {
        decisive = true;
        break;
      }
    } catch (e) {
      if (e === TIMEOUT) break;
      throw e;
    }
  }

  return {
    cp: alpha,
    winPercent: evalPercent(alpha),
    side,
    depth: depthReached,
    nodes,
    decisive,
  };
}

export function chooseMove({ board, side, level, rules = DEFAULT_RULES, timeMs }: AIRequest): Move | null {
  const moves = legalMoves(board, side, rules);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];
  const cfg = LEVELS[level];
  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const ctx: Ctx = { deadline: Date.now() + (timeMs ?? cfg.timeMs), nodes: 0, rules };
  let rootMoves = orderMoves(shuffle(moves.slice()));
  let best = rootMoves[0];
  const opp = other(side);

  for (let depth = 1; depth <= cfg.maxDepth; depth++) {
    try {
      const scored: { m: Move; s: number }[] = [];
      let alpha = -Infinity;
      for (const m of rootMoves) {
        const child = applyMove(board, m);
        const s =
          cfg.noise > 0
            ? -negamax(ctx, child, opp, depth - 1, -Infinity, Infinity, 1)
            : -negamax(ctx, child, opp, depth - 1, -Infinity, -alpha, 1);
        if (s > alpha) alpha = s;
        scored.push({ m, s: s + (cfg.noise ? (Math.random() * 2 - 1) * cfg.noise : 0) });
      }
      scored.sort((a, b) => b.s - a.s);
      best = scored[0].m;
      rootMoves = scored.map((x) => x.m);
      if (Math.abs(alpha) > WIN / 2) break; // forced result found
    } catch (e) {
      if (e === TIMEOUT) break;
      throw e;
    }
  }
  return best;
}

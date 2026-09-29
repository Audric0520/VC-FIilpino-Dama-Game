/**
 * Filipino Dama (Philippine Checkers) rules engine.
 *
 * Board: 64-cell array indexed row * 8 + col (row 0 = top of the screen).
 * Cell values: 0 = empty, 1 = Player 1 man, 2 = Player 1 Dama (king),
 *             -1 = Player 2 man, -2 = Player 2 Dama.
 * Player 1 starts at the bottom (rows 5-7) and moves "up" (towards row 0).
 * Player 2 starts at the top (rows 0-2) and moves "down" (towards row 7).
 *
 * Board orientation: the traditional Filipino board is "mirrored" — it sits so that each
 * player has a dark square in the near-left corner, which puts the double corner on each
 * player's left (see isDarkSquare). Play is on the dark squares, so Player 1 opens with
 * pieces on a1 c1 e1 g1 / b2 d2 f2 h2 / a3 c3 e3 g3.
 */

export type Side = 1 | 2;
export type Board = number[];

export interface Rules {
  /** Tournament option: the capture sequence taking the most pieces is compulsory. */
  maxCapture: boolean;
  /** A man touching the far row during a capture is crowned instantly and continues jumping as a Dama. */
  crownMidCapture: boolean;
  /** Tournament option: the game is an immediate draw once every piece on the board is a Dama. */
  allDamaDraw: boolean;
}

/** Rules exactly as specified: capture is mandatory (any capture may be chosen) and crowning is instant. */
export const DEFAULT_RULES: Rules = { maxCapture: false, crownMidCapture: true, allDamaDraw: false };

export interface Move {
  from: number;
  /** Landing squares in order (length 1 for a simple move, >= 1 for captures). */
  path: number[];
  /** Squares of the captured pieces, aligned with `path` (empty for simple moves). */
  captures: number[];
  /** True when the moving man ends the move as a Dama. */
  promotes: boolean;
}

export const row = (sq: number) => sq >> 3;
export const col = (sq: number) => sq & 7;
export const toSq = (r: number, c: number) => r * 8 + c;
export const onBoard = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

/**
 * Filipino boards are traditionally "mirrored": the board is turned so that each player has
 * a dark square in the near-left corner (a1 for the bottom player, h8 for the top player),
 * which puts the double corner on each player's left. Dark (playable) squares therefore
 * have an odd row + col.
 */
export const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 1;

export const DARK_SQUARES: number[] = [];
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (isDarkSquare(r, c)) DARK_SQUARES.push(toSq(r, c));

/** Diagonal directions: 0 = up-left, 1 = up-right, 2 = down-left, 3 = down-right. */
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/** RAYS[sq][dir] = the squares along a diagonal starting next to `sq`. */
export const RAYS: number[][][] = [];
for (let sq = 0; sq < 64; sq++) {
  const r0 = row(sq);
  const c0 = col(sq);
  RAYS[sq] = DIRS.map(([dr, dc]) => {
    const ray: number[] = [];
    let r = r0 + dr;
    let c = c0 + dc;
    while (onBoard(r, c)) {
      ray.push(toSq(r, c));
      r += dr;
      c += dc;
    }
    return ray;
  });
}

const FORWARD_DIRS: Record<Side, number[]> = { 1: [0, 1], 2: [2, 3] };

export const other = (s: Side): Side => (s === 1 ? 2 : 1);
export const sideOf = (v: number): Side | 0 => (v > 0 ? 1 : v < 0 ? 2 : 0);
export const isKing = (v: number) => v === 2 || v === -2;
export const promotionRow = (s: Side) => (s === 1 ? 0 : 7);
export const belongsTo = (v: number, s: Side) => (s === 1 ? v > 0 : v < 0);

export function initialBoard(): Board {
  const b: Board = new Array(64).fill(0);
  for (const sq of DARK_SQUARES) {
    const r = row(sq);
    if (r <= 2) b[sq] = -1;
    else if (r >= 5) b[sq] = 1;
  }
  return b;
}

/** All complete capture sequences available to the piece on `from`. */
export function capturesFrom(board: Board, from: number, rules: Rules = DEFAULT_RULES): Move[] {
  const v = board[from];
  if (!v) return [];
  const side: Side = v > 0 ? 1 : 2;
  const startKing = isKing(v);
  const promo = promotionRow(side);
  const enemy = side === 1 ? (x: number) => x < 0 : (x: number) => x > 0;

  // The moving piece has left its square; captured pieces stay on the board
  // (as blockers that cannot be jumped twice) until the whole move is finished.
  const work = board.slice();
  work[from] = 0;
  const path: number[] = [];
  const caps: number[] = [];
  const out: Move[] = [];

  const dfs = (pos: number, king: boolean) => {
    let extended = false;
    const rays = RAYS[pos];
    for (let d = 0; d < 4; d++) {
      const ray = rays[d];
      if (king) {
        // Flying capture: slide over empty squares, jump one enemy, land on any empty square beyond.
        let i = 0;
        while (i < ray.length && work[ray[i]] === 0) i++;
        if (i >= ray.length - 1) continue;
        const target = ray[i];
        if (!enemy(work[target]) || caps.includes(target)) continue;
        for (let j = i + 1; j < ray.length && work[ray[j]] === 0; j++) {
          extended = true;
          path.push(ray[j]);
          caps.push(target);
          dfs(ray[j], true);
          path.pop();
          caps.pop();
        }
      } else {
        // Men capture forward AND backward over an adjacent enemy piece.
        if (ray.length < 2) continue;
        const mid = ray[0];
        const land = ray[1];
        if (!enemy(work[mid]) || work[land] !== 0 || caps.includes(mid)) continue;
        extended = true;
        path.push(land);
        caps.push(mid);
        dfs(land, rules.crownMidCapture && row(land) === promo);
        path.pop();
        caps.pop();
      }
    }
    // A sequence ends only when no further jump exists (continuing is mandatory).
    if (!extended && path.length) {
      const dest = path[path.length - 1];
      out.push({
        from,
        path: path.slice(),
        captures: caps.slice(),
        promotes: !startKing && (king || row(dest) === promo),
      });
    }
  };

  dfs(from, startKing);
  return out;
}

/** Non-capturing moves for the piece on `from`. */
export function quietMovesFrom(board: Board, from: number): Move[] {
  const v = board[from];
  if (!v) return [];
  const side: Side = v > 0 ? 1 : 2;
  const out: Move[] = [];
  if (isKing(v)) {
    for (let d = 0; d < 4; d++) {
      for (const sq of RAYS[from][d]) {
        if (board[sq] !== 0) break;
        out.push({ from, path: [sq], captures: [], promotes: false });
      }
    }
  } else {
    const promo = promotionRow(side);
    for (const d of FORWARD_DIRS[side]) {
      const ray = RAYS[from][d];
      if (ray.length && board[ray[0]] === 0) {
        out.push({ from, path: [ray[0]], captures: [], promotes: row(ray[0]) === promo });
      }
    }
  }
  return out;
}

/** All legal moves for `side`. Captures are mandatory: if any exist, only captures are returned. */
export function legalMoves(board: Board, side: Side, rules: Rules = DEFAULT_RULES): Move[] {
  let caps: Move[] = [];
  for (const sq of DARK_SQUARES) {
    const v = board[sq];
    if (v !== 0 && belongsTo(v, side)) {
      const c = capturesFrom(board, sq, rules);
      if (c.length) caps = caps.length ? caps.concat(c) : c;
    }
  }
  if (caps.length) {
    if (rules.maxCapture) {
      let max = 0;
      for (const m of caps) if (m.captures.length > max) max = m.captures.length;
      caps = caps.filter((m) => m.captures.length === max);
    }
    return caps;
  }
  const out: Move[] = [];
  for (const sq of DARK_SQUARES) {
    const v = board[sq];
    if (v !== 0 && belongsTo(v, side)) {
      const q = quietMovesFrom(board, sq);
      for (const m of q) out.push(m);
    }
  }
  return out;
}

export function applyMove(board: Board, m: Move): Board {
  const b = board.slice();
  const v = b[m.from];
  b[m.from] = 0;
  for (const c of m.captures) b[c] = 0;
  const dest = m.path[m.path.length - 1];
  b[dest] = m.promotes ? (v > 0 ? 2 : -2) : v;
  return b;
}

export const moveDest = (m: Move) => m.path[m.path.length - 1];
export const sameMove = (a: Move, b: Move) =>
  a.from === b.from && a.path.length === b.path.length && a.path.every((p, i) => p === b.path[i]);

export function countPieces(b: Board, s: Side) {
  let men = 0;
  let kings = 0;
  for (const sq of DARK_SQUARES) {
    const v = b[sq];
    if (v !== 0 && belongsTo(v, s)) {
      if (isKing(v)) kings++;
      else men++;
    }
  }
  return { men, kings, total: men + kings };
}

/**
 * Tournament draw condition: both sides still have at least one piece and every
 * piece on the board is a Dama (king).
 */
export function allDamaPosition(b: Board): boolean {
  let p1 = 0;
  let p2 = 0;
  for (const sq of DARK_SQUARES) {
    const v = b[sq];
    if (v === 0) continue;
    if (!isKing(v)) return false;
    if (v > 0) p1++;
    else p2++;
  }
  return p1 > 0 && p2 > 0;
}

/* ------------------------------------------------------------------ */
/* Notation                                                            */
/* ------------------------------------------------------------------ */

export const FILES = 'abcdefgh';
export const squareName = (sq: number) => FILES[col(sq)] + (8 - row(sq));

export function parseSquare(name: string): number {
  const f = FILES.indexOf(name[0]);
  const rank = Number(name.slice(1));
  if (f < 0 || !(rank >= 1 && rank <= 8)) throw new Error(`Bad square ${name}`);
  return toSq(8 - rank, f);
}

export function moveNotation(m: Move): string {
  const sep = m.captures.length ? '×' : '–';
  return [m.from, ...m.path].map(squareName).join(sep);
}

/**
 * Build a board from piece lists, e.g. p1 = "c3 e3 Kd4", p2 = "d6 Kb8".
 * A leading "K" marks a Dama.
 */
export function boardFromSetup(p1: string, p2: string): Board {
  const b: Board = new Array(64).fill(0);
  const place = (list: string, side: Side) => {
    for (const tok of list.split(/[\s,]+/).filter(Boolean)) {
      const king = tok[0] === 'K';
      const sq = parseSquare(king ? tok.slice(1) : tok);
      if (!isDarkSquare(row(sq), col(sq))) throw new Error(`${tok} is not a dark square`);
      b[sq] = (side === 1 ? 1 : -1) * (king ? 2 : 1);
    }
  };
  place(p1, 1);
  place(p2, 2);
  return b;
}

/* ------------------------------------------------------------------ */
/* Game outcome                                                        */
/* ------------------------------------------------------------------ */

/** House rule to stop endless games: this many consecutive Dama-only moves without a capture is a draw. */
export const DRAW_QUIET_LIMIT = 50;

export interface Outcome {
  winner: Side | null;
  reason: 'no-pieces' | 'no-moves' | 'draw' | 'all-dama';
}

export function getOutcome(board: Board, turn: Side, quietPlies: number, rules: Rules = DEFAULT_RULES): Outcome | null {
  // Tournament rule: the moment every piece on the board is a Dama, the game is an immediate draw.
  if (rules.allDamaDraw && allDamaPosition(board)) return { winner: null, reason: 'all-dama' };
  const moves = legalMoves(board, turn, rules);
  if (moves.length === 0) {
    const left = countPieces(board, turn).total;
    return { winner: other(turn), reason: left === 0 ? 'no-pieces' : 'no-moves' };
  }
  if (quietPlies >= DRAW_QUIET_LIMIT) return { winner: null, reason: 'draw' };
  return null;
}

/** Quiet-move counter update: resets on any capture or man move. */
export function nextQuietCount(board: Board, m: Move, prev: number) {
  if (m.captures.length || !isKing(board[m.from])) return 0;
  return prev + 1;
}

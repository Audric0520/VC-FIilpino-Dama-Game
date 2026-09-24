/**
 * Random-search puzzle generator (development tool).
 *   esbuild scripts/gen-puzzles.ts --bundle --platform=node --format=esm --outfile=/tmp/gen.mjs
 *   node /tmp/gen.mjs <category> [budgetMs] [topN]
 * Categories: cap3m cap4 kcap4 cap5 cap7 block1 block2 win1 win2 win2q win2cap win3 win3q
 */
import {
  applyMove,
  DARK_SQUARES,
  isKing,
  legalMoves,
  moveNotation,
  row,
  squareName,
  type Board,
  type Move,
} from '../src/game/engine';
import { bestDefense, canForceWin, winningMoves } from '../src/game/solver';

const cat = process.argv[2] ?? 'cap3m';
const budgetMs = Number(process.argv[3] ?? 20000);
const topN = Number(process.argv[4] ?? 10);

const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomBoard(m1: number, k1: number, m2: number, k2: number): Board {
  const b: Board = new Array(64).fill(0);
  const free = shuffle(DARK_SQUARES.slice());
  const put = (v: number, n: number, ok: (sq: number) => boolean) => {
    for (let i = 0; i < n; i++) {
      const idx = free.findIndex(ok);
      if (idx >= 0) b[free.splice(idx, 1)[0]] = v;
    }
  };
  put(2, k1, () => true);
  put(-2, k2, () => true);
  put(1, m1, (sq) => row(sq) >= 1);
  put(-1, m2, (sq) => row(sq) <= 6);
  return b;
}

function setupOf(b: Board) {
  const p1: string[] = [];
  const p2: string[] = [];
  for (const sq of DARK_SQUARES) {
    const v = b[sq];
    if (!v) continue;
    (v > 0 ? p1 : p2).push((isKing(v) ? 'K' : '') + squareName(sq));
  }
  return { p1: p1.join(' '), p2: p2.join(' ') };
}

const count = (b: Board, s: 1 | -1) => b.filter((v) => v * s > 0).length;
const material = (b: Board, s: 1 | -1) => b.reduce((a, v) => a + (v * s > 0 ? (isKing(v) ? 3 : 1) : 0), 0);
const maxCap = (ms: Move[]) => ms.reduce((a, m) => Math.max(a, m.captures.length), 0);
const firstHops = (ms: Move[]) => new Set(ms.map((m) => m.from * 64 + m.path[0])).size;
const winsNow = (b: Board, m: Move) => legalMoves(applyMove(b, m), 2).length === 0;
const backJumps = (m: Move) => {
  let prev = m.from;
  let n = 0;
  for (const p of m.path) {
    if (row(p) > row(prev)) n++;
    prev = p;
  }
  return n;
};
const altList = (ms: Move[], skip: Move) =>
  ms
    .filter((m) => m !== skip)
    .map((m) => `${moveNotation(m)}(${m.captures.length})`)
    .join(' ');

function line(b: Board, n: number) {
  const out: string[] = [];
  let board = b;
  for (let k = n; k >= 1; k--) {
    const wm = winningMoves(board, 1, k);
    if (!wm.length) break;
    out.push(moveNotation(wm[0]));
    board = applyMove(board, wm[0]);
    const d = bestDefense(board, 1, k - 1);
    if (!d) break;
    out.push(moveNotation(d));
    board = applyMove(board, d);
  }
  return out;
}

const GEN: Record<string, () => Board> = {
  cap3m: () => randomBoard(rint(2, 4), 0, rint(3, 6), 0),
  cap4: () => randomBoard(rint(1, 3), 0, rint(4, 7), 0),
  kcap4: () => randomBoard(rint(0, 2), 1, rint(4, 7), 0),
  cap5: () => randomBoard(rint(1, 3), rint(0, 1), rint(5, 8), rint(0, 1)),
  cap7: () => randomBoard(rint(0, 3), 1, rint(7, 9), rint(0, 1)),
  block1: () => randomBoard(rint(2, 5), rint(0, 1), rint(1, 4), 0),
  block2: () => randomBoard(rint(2, 5), rint(0, 1), rint(2, 4), 0),
  win1: () => randomBoard(rint(1, 3), rint(0, 1), rint(2, 4), rint(0, 1)),
  win2: () => randomBoard(rint(2, 4), rint(0, 1), rint(2, 5), rint(0, 1)),
  win2q: () => randomBoard(rint(2, 4), rint(0, 1), rint(2, 5), rint(0, 1)),
  win2cap: () => randomBoard(rint(2, 4), rint(0, 1), rint(3, 5), rint(0, 1)),
  win3: () => randomBoard(rint(2, 4), rint(0, 1), rint(2, 4), rint(0, 1)),
  win3q: () => randomBoard(rint(2, 4), rint(0, 1), rint(2, 4), rint(0, 1)),
};

type Result = { score: number; data: Record<string, unknown> } | null;

function captureCat(
  b: Board,
  moves: Move[],
  min: number,
  max: number,
  minHops: number,
  opts: { noPromo?: boolean; king?: boolean } = {},
): Result {
  if (!moves[0].captures.length) return null;
  const top = maxCap(moves);
  if (top < min || top > max) return null;
  const best = moves.filter((m) => m.captures.length === top);
  if (best.length !== 1) return null;
  const fh = firstHops(moves);
  if (fh < minHops) return null;
  if (opts.noPromo && moves.some((m) => m.promotes)) return null;
  const king = isKing(b[best[0].from]);
  if (opts.king && !king) return null;
  const bj = backJumps(best[0]);
  return {
    score: top * 3 + fh + moves.length * 0.25 + (bj ? 1.5 : 0),
    data: { max: top, options: moves.length, fh, bj, king, sol: moveNotation(best[0]), alts: altList(moves, best[0]) },
  };
}

function winCat(b: Board, moves: Move[], n: number, quietOnly: boolean, captureFirst: boolean): Result {
  if (captureFirst && !moves[0].captures.length) return null;
  for (let k = 1; k < n; k++) if (canForceWin(b, 1, 1, 2 * k - 1)) return null;
  if (!canForceWin(b, 1, 1, 2 * n - 1)) return null;
  const wins = winningMoves(b, 1, n);
  if (wins.length !== 1) return null;
  const m = wins[0];
  if (quietOnly && (m.promotes || m.captures.length)) return null;
  const after = applyMove(b, m);
  const replies = legalMoves(after, 2);
  const sac = !m.captures.length && replies.length > 0 && replies[0].captures.length > 0;
  const trick = m.captures.length > 0 && m.captures.length < maxCap(moves);
  const matDiff = material(b, 1) - material(b, -1);
  return {
    score: (sac ? 6 : 0) + (trick ? 6 : 0) + (m.captures.length ? 0 : 2) + moves.length * 0.4 - matDiff * 1.5,
    data: {
      n,
      options: moves.length,
      sac,
      trick,
      forcedReply: replies.length === 1,
      matDiff,
      key: moveNotation(m),
      line: line(b, n).join(', '),
      alts: captureFirst ? altList(moves, m) : undefined,
    },
  };
}

function evaluate(b: Board): Result {
  const moves = legalMoves(b, 1);
  if (moves.length < 3) return null;
  const opp = legalMoves(b, 2).length;
  if (!opp) return null;
  switch (cat) {
    case 'cap3m':
      return captureCat(b, moves, 3, 3, 3, { noPromo: true });
    case 'cap4':
      return captureCat(b, moves, 4, 4, 3);
    case 'kcap4':
      return captureCat(b, moves, 4, 4, 4, { king: true });
    case 'cap5':
      return captureCat(b, moves, 5, 5, 4);
    case 'cap7':
      return captureCat(b, moves, 7, 9, 3);
    case 'block1':
    case 'block2': {
      if (moves[0].captures.length || moves.length < 5) return null;
      const bc = count(b, -1);
      if (cat === 'block2' && (bc < 2 || opp < 2)) return null;
      const wins = moves.filter((m) => winsNow(b, m));
      if (wins.length !== 1) return null;
      return {
        score: bc * 3 + moves.length * 0.3 + opp,
        data: { options: moves.length, oppMoves: opp, black: bc, sol: moveNotation(wins[0]) },
      };
    }
    case 'win1': {
      if (!moves[0].captures.length) return null;
      const wins = moves.filter((m) => winsNow(b, m));
      if (wins.length !== 1) return null;
      const w = wins[0];
      const top = maxCap(moves);
      const trick = w.captures.length < top;
      const all = count(applyMove(b, w), -1) === 0;
      return {
        score: (trick ? 8 : 0) + moves.length * 0.5 + firstHops(moves) + count(b, -1),
        data: { options: moves.length, trick, all, caps: w.captures.length, max: top, sol: moveNotation(w), alts: altList(moves, w) },
      };
    }
    case 'win2':
      return winCat(b, moves, 2, false, false);
    case 'win2q':
      return winCat(b, moves, 2, true, false);
    case 'win2cap':
      return winCat(b, moves, 2, false, true);
    case 'win3':
      return winCat(b, moves, 3, false, false);
    case 'win3q':
      return winCat(b, moves, 3, true, false);
  }
  return null;
}

const gen = GEN[cat];
if (!gen) throw new Error(`Unknown category ${cat}`);
const found = new Map<string, { score: number; data: Record<string, unknown> }>();
let tried = 0;
const t0 = Date.now();
while (Date.now() - t0 < budgetMs) {
  tried++;
  const b = gen();
  const r = evaluate(b);
  if (!r) continue;
  const s = setupOf(b);
  const key = `${s.p1}|${s.p2}`;
  if (!found.has(key)) found.set(key, { score: r.score, data: { cat, ...s, ...r.data } });
}
const list = [...found.values()].sort((a, b) => b.score - a.score);
console.log(`# ${cat}: tried ${tried}, found ${list.length}`);
for (const f of list.slice(0, topN)) console.log(JSON.stringify({ score: Math.round(f.score * 10) / 10, ...f.data }));

/**
 * Verifies every puzzle with the exact solver.
 *   esbuild scripts/verify-puzzles.ts --bundle --platform=node --format=esm --outfile=/tmp/verify.mjs
 *   node /tmp/verify.mjs [lines.json]
 */
import { writeFileSync } from 'fs';
import { applyMove, boardFromSetup, legalMoves, moveNotation, squareName, type Move } from '../src/game/engine';
import { DIFFICULTIES, PUZZLES } from '../src/game/puzzles';
import { bestDefense, maxCaptureCount, winDistance, winningMoves } from '../src/game/solver';

const jsonOut = process.argv[2];
let problems = 0;
const fail = (msg: string) => {
  problems++;
  console.log(`BAD  ${msg}`);
};

// ---- Structure ---------------------------------------------------------
const counts = DIFFICULTIES.map((d) => PUZZLES.filter((p) => p.difficulty === d).length);
if (PUZZLES.length !== 30 || counts.some((c) => c !== 10)) fail(`expected 10/10/10 levels, got ${counts.join('/')}`);
const order = PUZZLES.map((p) => DIFFICULTIES.indexOf(p.difficulty));
if (order.some((o, i) => i > 0 && o < order[i - 1])) fail('levels are not ordered Easy → Medium → Hard');
for (const key of ['id', 'title'] as const) {
  if (new Set(PUZZLES.map((p) => p[key])).size !== PUZZLES.length) fail(`duplicate ${key}s`);
}
if (new Set(PUZZLES.map((p) => `${p.p1}|${p.p2}`)).size !== PUZZLES.length) fail('duplicate positions');

// ---- Each puzzle -----------------------------------------------------------
const toSquares = (m: Move) => [m.from, ...m.path].map(squareName);
const lines: unknown[] = [];

PUZZLES.forEach((p, i) => {
  const t0 = Date.now();
  const b = boardFromSetup(p.p1, p.p2);
  const legal = legalMoves(b, 1);
  const seq: { side: 1 | 2; squares: string[]; text: string }[] = [];
  const g = p.goal;
  const issues: string[] = [];
  let info = '';

  const tierOk =
    p.difficulty === 'Easy'
      ? g.type === 'capture' ? g.count >= 3 && g.count <= 4 : g.moves === 1
      : p.difficulty === 'Medium'
        ? g.type === 'capture' ? g.count >= 5 && g.count <= 6 : g.moves === 2
        : g.type === 'capture' ? g.count >= 7 : g.moves === 3;
  if (!tierOk) issues.push('goal does not match difficulty');

  if (g.type === 'capture') {
    const max = maxCaptureCount(b, 1);
    const best = legal.filter((m) => m.captures.length === max);
    if (max !== g.count) issues.push(`max capture is ${max}`);
    if (best.length !== 1) issues.push(`${best.length} longest captures`);
    if (best[0]) seq.push({ side: 1, squares: toSquares(best[0]), text: moveNotation(best[0]) });
    info = `max=${max}`;
  } else {
    const n = g.moves;
    const d = winDistance(b, 1, n);
    const wins = winningMoves(b, 1, n);
    if (d !== n) issues.push(`wins in ${d}, not ${n}`);
    if (wins.length !== 1) issues.push(`${wins.length} winning first moves`);
    let board = b;
    let won = false;
    for (let k = n; k >= 1; k--) {
      const wm = winningMoves(board, 1, k);
      if (!wm.length) break;
      seq.push({ side: 1, squares: toSquares(wm[0]), text: moveNotation(wm[0]) });
      board = applyMove(board, wm[0]);
      if (legalMoves(board, 2).length === 0) {
        won = true;
        break;
      }
      const def = bestDefense(board, 1, k - 1);
      if (!def) break;
      seq.push({ side: 2, squares: toSquares(def), text: moveNotation(def) });
      board = applyMove(board, def);
    }
    if (!won) issues.push('main line does not end in a win');
    info = `winIn=${d}`;
  }

  // Every move written in the lesson must appear in the solution line.
  const tokens = p.lesson.match(/[a-h][1-8](?:[×–][a-h][1-8])+/g) ?? [];
  const missing = tokens.filter((t) => !seq.some((s) => s.text.includes(t)));
  if (!tokens.length) issues.push('lesson has no notation');
  if (missing.length) issues.push(`lesson notation not in line: ${missing.join(' ')}`);

  const line = seq.map((s) => s.text).join(', ');
  const tag = `${String(i + 1).padStart(2)} ${p.difficulty.padEnd(6)} ${p.title}`;
  if (issues.length) fail(`${tag}: ${issues.join('; ')} | line: ${line}`);
  else console.log(`OK   ${tag}: ${info} options=${legal.length} | ${line} (${Date.now() - t0}ms)`);
  lines.push({ index: i, id: p.id, difficulty: p.difficulty, moves: seq.map(({ side, squares }) => ({ side, squares })) });
});

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(lines, null, 1));
console.log(problems ? `\n${problems} PROBLEM(S)` : `\nAll ${PUZZLES.length} puzzles verified (${counts.join('/')} Easy/Medium/Hard).`);

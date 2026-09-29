import {
  allDamaPosition,
  applyMove,
  boardFromSetup,
  DARK_SQUARES,
  DEFAULT_RULES,
  getOutcome,
  initialBoard,
  isDarkSquare,
  legalMoves,
  moveNotation,
  nextQuietCount,
  other,
  squareName,
  type Board,
  type Side,
} from '../src/game/engine';
import { analyzePosition, chooseMove, evalPercent, formatEvalCp, type Level } from '../src/game/ai';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
  if (!cond) failures++;
}
const names = (b: Board, s: Side, rules = DEFAULT_RULES) => legalMoves(b, s, rules).map(moveNotation).sort();

// 1. Opening move counts and starting formation
const init = initialBoard();
check('P1 has 7 opening moves', legalMoves(init, 1).length === 7, names(init, 1).join(' '));
check('P2 has 7 opening moves', legalMoves(init, 2).length === 7, names(init, 2).join(' '));
check('12 pieces each', init.filter((v) => v === 1).length === 12 && init.filter((v) => v === -1).length === 12);

// The board sits in the mirrored orientation: a dark square in each player's near-left
// corner, so Player 1 opens on a1 c1 e1 g1 / b2 d2 f2 h2 / a3 c3 e3 g3.
const squaresOf = (b: Board, s: Side) => b.map((v, i) => ((s === 1 ? v > 0 : v < 0) ? squareName(i) : null)).filter(Boolean).join(' ');
const whiteHome = 'a3 c3 e3 g3 b2 d2 f2 h2 a1 c1 e1 g1';
const blackHome = 'b8 d8 f8 h8 a7 c7 e7 g7 b6 d6 f6 h6';
check('P1 starts on the mirrored dark squares', squaresOf(init, 1) === whiteHome, squaresOf(init, 1));
check('P2 starts on the mirrored dark squares', squaresOf(init, 2) === blackHome, squaresOf(init, 2));
check('a1 (near-left corner) is a playable dark square', isDarkSquare(7, 0) && isDarkSquare(0, 7));
check('every piece starts on a dark square', init.every((v, sq) => !v || DARK_SQUARES.includes(sq)));

// 2. Man captures backward
let b = boardFromSetup('d4', 'e3');
check('Man captures backward', JSON.stringify(names(b, 1)) === JSON.stringify(['d4×f2']), names(b, 1).join(' '));

// 3. Mandatory capture blocks quiet moves
b = boardFromSetup('d4 h2', 'e3');
check('Capture is mandatory', JSON.stringify(names(b, 1)) === JSON.stringify(['d4×f2']), names(b, 1).join(' '));

// 4. Multi-capture must continue
b = boardFromSetup('f2', 'e3 e5');
check('Multi-jump continues', JSON.stringify(names(b, 1)) === JSON.stringify(['f2×d4×f6']), names(b, 1).join(' '));

// 5. Flying king captures from distance, lands anywhere beyond
b = boardFromSetup('Ka1', 'e5');
check('Flying king capture', JSON.stringify(names(b, 1)) === JSON.stringify(['a1×f6', 'a1×g7', 'a1×h8']), names(b, 1).join(' '));

// 6. Flying king quiet move count on open board (long diagonal h8-a1 is dark)
b = boardFromSetup('Kd4', 'h8');
check('King slides any distance', legalMoves(b, 1).length === 12, String(legalMoves(b, 1).length));

// 7. Instant crowning mid-capture (default) vs crown-at-end rule
b = boardFromSetup('f6', 'e7 b6');
const inst = legalMoves(b, 1);
check('Crown mid-capture continues as Dama', inst.length === 1 && moveNotation(inst[0]) === 'f6×d8×a5' && inst[0].promotes, inst.map(moveNotation).join(' '));
const tour = legalMoves(b, 1, { maxCapture: false, crownMidCapture: false, allDamaDraw: false });
check('Crown-at-end rule stops as man', tour.length === 1 && moveNotation(tour[0]) === 'f6×d8' && tour[0].promotes, tour.map(moveNotation).join(' '));

// 8. Maximum capture option
b = boardFromSetup('h2 b2', 'g3 c3 c5');
const free = names(b, 1);
const maxed = names(b, 1, { maxCapture: true, crownMidCapture: true, allDamaDraw: false });
check('Free capture choice (default)', free.length === 2, free.join(' '));
check('Max capture rule filters', maxed.length === 1 && maxed[0] === 'b2×d4×b6', maxed.join(' '));

// 9. Captured pieces are not jumped twice & removed at the end
b = boardFromSetup('Ka1', 'c3 e3 e5 c5');
const km = legalMoves(b, 1);
const maxK = Math.max(...km.map((m) => m.captures.length));
check('King circuit capture takes each piece once', maxK <= 4 && km.every((m) => new Set(m.captures).size === m.captures.length), `max=${maxK} n=${km.length}`);
const after = applyMove(b, km.find((m) => m.captures.length === maxK)!);
check('Captured pieces removed after move', after.filter((v) => v < 0).length === 4 - maxK);

// 10. Man simple move promotes
b = boardFromSetup('g7', 'Ka1');
const pm = legalMoves(b, 1).filter((m) => m.promotes);
check('Reaching far row promotes', pm.length === 2, legalMoves(b, 1).map(moveNotation).join(' '));

// 11. No moves = loss
const oc = getOutcome(boardFromSetup('a1', 'b2 d4 c3'), 1, 0);
check('Blocked side loses (no legal moves)', !!oc && oc.winner === 2 && oc.reason === 'no-moves', JSON.stringify(oc));
const oc2 = getOutcome(boardFromSetup('', 'b2'), 1, 0);
check('No pieces left loses', !!oc2 && oc2.winner === 2 && oc2.reason === 'no-pieces', JSON.stringify(oc2));

// 12. All-Dama draw (tournament rule)
const allDamaRules = { maxCapture: false, crownMidCapture: true, allDamaDraw: true };
b = boardFromSetup('Kd4', 'Kh8');
check('All-Dama position detected', allDamaPosition(b));
check('All-Dama draw off by default', getOutcome(b, 1, 0) === null);
const oc3 = getOutcome(b, 1, 0, allDamaRules);
check('All-Dama draw when enabled', !!oc3 && oc3.winner === null && oc3.reason === 'all-dama', JSON.stringify(oc3));
b = boardFromSetup('d4', 'Kh8');
check('A man on the board blocks the all-Dama draw', !allDamaPosition(b) && getOutcome(b, 1, 0, allDamaRules) === null);
b = boardFromSetup('Kd4', '');
check('One side empty is not all-Dama', !allDamaPosition(b));
const oc4 = getOutcome(b, 2, 0, allDamaRules);
check('Capturing the last piece still wins', !!oc4 && oc4.winner === 1 && oc4.reason === 'no-pieces', JSON.stringify(oc4));
b = boardFromSetup('g7', 'Ka3');
const promoMove = legalMoves(b, 1, allDamaRules).find((m) => m.promotes)!;
const afterPromo = applyMove(b, promoMove);
check(
  'Promotion completing all-Dama is a draw',
  allDamaPosition(afterPromo) && getOutcome(afterPromo, 2, 0, allDamaRules)?.reason === 'all-dama',
);
check('Same promotion plays on when off', getOutcome(afterPromo, 2, 0) === null);

// 13. AI respects the all-Dama draw (White is ahead: 2 Damas + man vs 1 Dama)
b = boardFromSetup('g7 Kb2 Ka1', 'Kd6');
const aiOn = chooseMove({ board: b, side: 1, level: 'hard', rules: allDamaRules, timeMs: 400 });
check('AI avoids promoting into an all-Dama draw', !!aiOn && !aiOn.promotes, aiOn ? moveNotation(aiOn) : 'null');
const aiOff = chooseMove({ board: b, side: 1, level: 'hard', timeMs: 400 });
check('AI still promotes with the rule off', !!aiOff && aiOff.promotes, aiOff ? moveNotation(aiOff) : 'null');

// 14. AI self-play sanity (terminates, legal moves only)
function play(l1: Level, l2: Level, rules = DEFAULT_RULES) {
  let board = initialBoard();
  let turn: Side = 1;
  let quiet = 0;
  let plies = 0;
  const t0 = Date.now();
  for (;;) {
    const o = getOutcome(board, turn, quiet, rules);
    if (o) return { o, board, plies, ms: Date.now() - t0 };
    const m = chooseMove({ board, side: turn, level: turn === 1 ? l1 : l2, timeMs: 150, rules });
    if (!m) throw new Error('AI returned null with moves available');
    const legal = legalMoves(board, turn, rules).some((x) => moveNotation(x) === moveNotation(m));
    if (!legal) throw new Error('AI played illegal move');
    quiet = nextQuietCount(board, m, quiet);
    board = applyMove(board, m);
    turn = other(turn);
    plies++;
  }
}
for (const [a, c] of [['hard', 'easy'], ['medium', 'hard'], ['hard', 'hard']] as [Level, Level][]) {
  const r = play(a, c);
  console.log(`Self-play P1=${a} P2=${c}: winner=${r.o.winner ?? 'draw'} (${r.o.reason}) after ${r.plies} plies in ${r.ms}ms`);
}
{
  const r = play('hard', 'hard', allDamaRules);
  check(
    'All-Dama-draw self-play ends correctly',
    r.o.reason !== 'all-dama' || (r.o.winner === null && allDamaPosition(r.board)),
    `winner=${r.o.winner ?? 'draw'} (${r.o.reason}) after ${r.plies} plies`,
  );
}

// 15. Position analysis (evaluation bar)
const startEval = analyzePosition({ board: initialBoard(), side: 1 });
check(
  'Initial position evaluates as balanced',
  Math.abs(startEval.cp) < 80 && startEval.winPercent >= 35 && startEval.winPercent <= 65,
  `cp=${startEval.cp} ${startEval.winPercent}%`,
);

const whiteUp = boardFromSetup('d4 f4', 'd6');
const aheadEval = analyzePosition({ board: whiteUp, side: 1 });
check('Material advantage scores for P1', aheadEval.cp > 0 && aheadEval.winPercent > 55, `cp=${aheadEval.cp}`);
check('Same position flips for opponent', analyzePosition({ board: whiteUp, side: 2 }).cp < 0);

check('evalPercent clamps forced results', evalPercent(1_000_000) === 100 && evalPercent(-1_000_000) === 0);
check(
  'formatEvalCp renders pawn-scale scores',
  formatEvalCp(250) === '+2.5' && formatEvalCp(-100) === '\u22121.0' && formatEvalCp(0) === '0.0',
  formatEvalCp(250),
);

const lostEval = analyzePosition({ board: boardFromSetup('', 'e5'), side: 1 });
check('Position with no moves is a loss', lostEval.decisive && lostEval.winPercent === 0, `cp=${lostEval.cp}`);

const allDamaEval = analyzePosition({ board: boardFromSetup('Kd4', 'Kh8'), side: 1, rules: allDamaRules });
check('Analysis honours the all-Dama draw rule', allDamaEval.cp === 0 && allDamaEval.winPercent === 50, `cp=${allDamaEval.cp}`);
check('evalPercent is monotonic', evalPercent(300) > evalPercent(100) && evalPercent(100) > 50 && evalPercent(-100) < 50);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll engine checks passed.');

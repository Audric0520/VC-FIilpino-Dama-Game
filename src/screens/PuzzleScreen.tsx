import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  Medal,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { applyMove, boardFromSetup, DEFAULT_RULES, legalMoves, moveNotation, type Board, type Move } from '../game/engine';
import { DIFFICULTIES, goalText, levelsOf, PUZZLES, type Difficulty, type Puzzle } from '../game/puzzles';
import { bestDefense, canForceWin, winningMoves } from '../game/solver';
import { sfx } from '../game/sound';
import { makeSnapshot, useDamaGame, type CommitInfo, type RejectReason } from '../hooks/useDamaGame';
import { DamaBoard } from '../components/Board';
import { GameHeader } from '../components/GameHeader';
import { MoveLog, newLogId, type LogEntry } from '../components/MoveLog';
import { BoardToast, Button, Confetti, Crown, toneClasses, type ToastData, type Tone } from '../components/ui';
import { cn } from '../utils/cn';

const SOLVED_KEY = 'filipino-dama-solved';

export function loadSolved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]');
    return Array.isArray(v) ? v.filter((id) => PUZZLES.some((p) => p.id === id)) : [];
  } catch {
    return [];
  }
}

function saveSolved(ids: string[]) {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export const DIFF_META: Record<
  Difficulty,
  { chip: string; text: string; bar: string; tagalog: string; summary: string }
> = {
  Easy: {
    chip: 'border-emerald-300/40 bg-emerald-500/15 text-emerald-200',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    tagalog: 'Madali',
    summary: 'Captures of 3–4 pieces and wins in 1 move',
  },
  Medium: {
    chip: 'border-amber-300/40 bg-amber-500/15 text-amber-200',
    text: 'text-amber-300',
    bar: 'bg-amber-400',
    tagalog: 'Katamtaman',
    summary: 'Wins in 2 moves and 5–6 piece sweeps',
  },
  Hard: {
    chip: 'border-rose-300/40 bg-rose-500/15 text-rose-200',
    text: 'text-rose-300',
    bar: 'bg-rose-400',
    tagalog: 'Mahirap',
    summary: 'Wins in 3 moves and 7–9 piece sweeps',
  },
};

type PStatus = 'playing' | 'correct' | 'wrong' | 'solved' | 'showing';

const startSnap = (p: Puzzle) => makeSnapshot(boardFromSetup(p.p1, p.p2), 1);
const PUZZLE_NAMES = { 1: 'You', 2: 'Black' } as const;

function maxCaptureMove(board: Board): Move | null {
  const moves = legalMoves(board, 1, DEFAULT_RULES);
  let best: Move | null = null;
  for (const m of moves) if (!best || m.captures.length > best.captures.length) best = m;
  return best;
}

export function PuzzleScreen({
  onMenu,
  onRules,
  startIndex = 0,
}: {
  onMenu: () => void;
  onRules: () => void;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const puzzle = PUZZLES[index];
  const [tab, setTab] = useState<Difficulty>(PUZZLES[startIndex].difficulty);
  const [status, setStatus] = useState<PStatus>('playing');
  const [feedback, setFeedback] = useState<{ text: string; tone: Tone } | null>(null);
  const [solved, setSolved] = useState<string[]>(loadSolved);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const playerMoves = useRef(0);
  const showingRef = useRef(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  };
  const clearLater = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  const wait = (ms: number) => new Promise<void>((res) => later(res, ms));
  useEffect(() => () => clearLater(), []);

  function showToast(text: string, tone: Tone, icon?: ReactNode) {
    setToast({ id: Date.now() + Math.random(), text, tone, icon });
    later(() => setToast(null), 2100);
  }

  function markSolved() {
    setStatus('solved');
    setHintMove(null);
    sfx.win();
    setCelebrate(true);
    later(() => setCelebrate(false), 4500);

    const already = solved.includes(puzzle.id);
    const next = already ? solved : [...solved, puzzle.id];
    if (!already) {
      setSolved(next);
      saveSolved(next);
    }
    const tierDone = levelsOf(puzzle.difficulty).every((p) => next.includes(p.id));
    const allDone = PUZZLES.every((p) => next.includes(p.id));
    let text = puzzle.lesson;
    if (!already && allDone) {
      showToast(`All ${PUZZLES.length} levels complete!`, 'gold', <Medal size={18} />);
      text = `${puzzle.lesson} You have solved every level. Mabuhay, Dama master!`;
    } else if (!already && tierDone) {
      const nextTier = DIFFICULTIES[DIFFICULTIES.indexOf(puzzle.difficulty) + 1];
      showToast(`All ${puzzle.difficulty} levels complete!`, 'gold', <Medal size={18} />);
      text = `${puzzle.lesson} You finished every ${puzzle.difficulty} level${nextTier ? `. On to ${nextTier}!` : '!'}`;
    } else {
      showToast('Puzzle solved!', 'good', <Trophy size={18} />);
    }
    setFeedback({ text, tone: 'good' });
  }

  function handleCommit({ move, mover, before, after }: CommitInfo) {
    setLog((l) => [
      ...l,
      {
        id: newLogId(),
        ply: after.ply,
        kind: 'move',
        side: mover,
        text: moveNotation(move),
        caps: move.captures.length,
        promo: move.promotes,
      },
    ]);
    if (move.promotes) {
      sfx.promote();
      showToast('Dama Promoted!', 'gold', <Crown className="h-5 w-5" />);
    }
    if (showingRef.current) return;

    if (mover === 2) {
      setStatus('playing');
      setFeedback({ text: 'Black replied with the toughest defense. Find the follow-up!', tone: 'info' });
      return;
    }

    const goal = puzzle.goal;
    playerMoves.current += 1;
    setHintMove(null);
    setHintLevel(0);
    let ok = false;
    let done = false;
    if (goal.type === 'capture') {
      ok = done = move.captures.length >= goal.count;
    } else {
      const left = goal.moves - playerMoves.current;
      if (legalMoves(after.board, 2, DEFAULT_RULES).length === 0) ok = done = true;
      else if (left > 0 && canForceWin(after.board, 1, 2, 2 * left)) ok = true;
    }

    if (done) {
      markSolved();
      return;
    }
    if (ok && goal.type === 'win') {
      setStatus('correct');
      setFeedback({ text: 'Correct! Watch how Black replies…', tone: 'good' });
      const reply = bestDefense(after.board, 1, goal.moves - playerMoves.current);
      later(() => {
        if (reply) void game.playMove(reply, 200);
      }, 500);
      return;
    }

    setStatus('wrong');
    sfx.error();
    const text =
      goal.type === 'capture'
        ? `That captures ${move.captures.length}. You need ${goal.count} in one turn. Try another route!`
        : 'Not quite. That move does not force a win in time. Try again!';
    setFeedback({ text, tone: 'bad' });
    showToast('Not the best move', 'bad', <XCircle size={18} />);
    later(() => {
      playerMoves.current -= 1;
      const s = game.undo();
      if (s) setLog((l) => l.filter((e) => e.ply <= before.ply));
      setStatus('playing');
    }, 1500);
  }

  function handleReject(reason: RejectReason) {
    sfx.error();
    if (reason === 'mandatory') showToast('Mandatory Capture Required!', 'warn');
    else if (reason === 'continue') showToast('Keep jumping! The capture must continue.', 'warn');
    else if (reason === 'no-moves') showToast('That piece has no legal moves.', 'info');
    else showToast('You play White in puzzles.', 'info');
  }

  const game = useDamaGame({
    initial: () => startSnap(PUZZLES[startIndex]),
    rules: DEFAULT_RULES,
    isHumanTurn: (turn) => turn === 1,
    locked: status !== 'playing',
    onCommit: handleCommit,
    onReject: handleReject,
  });

  function loadPuzzle(i: number) {
    clearLater();
    showingRef.current = false;
    playerMoves.current = 0;
    setIndex(i);
    setTab(PUZZLES[i].difficulty);
    setStatus('playing');
    setFeedback(null);
    setHintMove(null);
    setHintLevel(0);
    setLog([]);
    setCelebrate(false);
    setToast(null);
    game.reset(startSnap(PUZZLES[i]));
  }

  function solutionMove(board: Board): Move | null {
    const goal = puzzle.goal;
    if (goal.type === 'capture') return maxCaptureMove(board);
    return winningMoves(board, 1, goal.moves - playerMoves.current)[0] ?? null;
  }

  function showHint() {
    if (status !== 'playing' || game.busy) return;
    const m = solutionMove(game.snap.board);
    if (!m) return;
    const level = Math.min(2, hintLevel + 1);
    setHintLevel(level);
    setHintMove(m);
    sfx.hint();
    setFeedback({
      text: level === 1 ? `Hint: ${puzzle.hint}` : `Full hint: play ${moveNotation(m)}.`,
      tone: 'info',
    });
  }

  async function showSolution() {
    clearLater();
    showingRef.current = true;
    playerMoves.current = 0;
    setStatus('showing');
    setFeedback({ text: 'Watch the solution…', tone: 'info' });
    setHintMove(null);
    setHintLevel(0);
    setLog([]);
    setCelebrate(false);
    const start = startSnap(puzzle);
    game.reset(start);
    const session = game.sessionRef.current;
    const alive = () => session === game.sessionRef.current;
    let board = start.board;
    await wait(450);
    if (!alive()) return;
    const goal = puzzle.goal;
    if (goal.type === 'capture') {
      const m = maxCaptureMove(board);
      if (m && !(await game.playMove(m))) return;
    } else {
      for (let k = goal.moves; k >= 1; k--) {
        const wm = winningMoves(board, 1, k)[0];
        if (!wm) break;
        if (!(await game.playMove(wm))) return;
        board = applyMove(board, wm);
        const d = bestDefense(board, 1, k - 1);
        if (!d) break;
        await wait(380);
        if (!alive()) return;
        if (!(await game.playMove(d))) return;
        board = applyMove(board, d);
        await wait(300);
        if (!alive()) return;
      }
    }
    if (!alive()) return;
    setFeedback({ text: `Solution: ${puzzle.lesson}`, tone: 'gold' });
  }

  // --- Derived ---------------------------------------------------------
  const goal = puzzle.goal;
  const movesLeft = goal.type === 'win' ? Math.max(0, goal.moves - playerMoves.current) : 1;
  const solvedCount = solved.length;
  const isSolved = solved.includes(puzzle.id);
  const turnLabel =
    status === 'solved'
      ? 'Puzzle solved!'
      : status === 'showing'
        ? 'Showing solution'
        : status === 'correct'
          ? 'Black is replying…'
          : status === 'wrong'
            ? 'Try again'
            : 'Your move (White)';

  const defaultFeedback: { text: string; tone: Tone } = {
    text:
      goal.type === 'capture'
        ? 'Find the capture sequence that takes the most pieces. Capturing is mandatory, but the route is yours to choose.'
        : 'Find the winning move. Black always answers with the toughest defense.',
    tone: 'info',
  };
  const fb = feedback ?? defaultFeedback;
  const mustSquares = game.interactive && game.mustCapture && !game.partial ? game.movable : [];
  const hint = hintMove ? { from: hintMove.from, path: hintLevel >= 2 ? hintMove.path : [] } : null;

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader
        modeLabel={`Dama Puzzles · Level ${index + 1}`}
        turnLabel={turnLabel}
        turnSide={status === 'solved' ? null : game.snap.turn}
        thinking={status === 'correct'}
        finished={status === 'solved'}
        score={
          <span className="flex items-center gap-1.5">
            <Trophy size={15} className="text-amber-300" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-stone-400 sm:inline">Solved</span>
            <b className="tabular-nums text-stone-100">
              {solvedCount}/{PUZZLES.length}
            </b>
          </span>
        }
        onRestart={() => loadPuzzle(index)}
        restartLabel="Restart Puzzle"
        onMenu={onMenu}
        onRules={onRules}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-center lg:gap-7 lg:py-6">
        <section className="board-col fade-in flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Target size={16} className="shrink-0 text-amber-300" />
              <span className="truncate text-sm font-semibold text-stone-100">{goalText(goal)}</span>
            </div>
            {goal.type === 'win' && (
              <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-stone-200">
                {movesLeft} move{movesLeft === 1 ? '' : 's'} left
              </span>
            )}
          </div>
          <DamaBoard
            board={game.display.board}
            ids={game.display.ids}
            fading={game.display.fading}
            moverSq={game.display.moverSq}
            selected={game.selected}
            targets={game.interactive ? game.targets : []}
            victims={game.interactive ? game.victims : []}
            mustSquares={mustSquares}
            lastMove={game.busy ? null : game.snap.lastMove}
            hint={hint}
            interactive={game.interactive}
            clickable={game.interactive ? game.movable : []}
            shake={game.shake}
            promotedId={game.promotedId}
            onSquareClick={game.clickSquare}
            overlay={<BoardToast toast={toast} />}
          />
        </section>

        <aside className="flex w-full max-w-[600px] flex-col gap-3 lg:w-[380px] lg:max-w-none">
          <div className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                Level {index + 1} of {PUZZLES.length}
              </span>
              <div className="flex items-center gap-1.5">
                {isSolved && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                    <Check size={12} /> Solved
                  </span>
                )}
                <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', DIFF_META[puzzle.difficulty].chip)}>
                  {puzzle.difficulty}
                </span>
              </div>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-stone-50">{puzzle.title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-400">
              <Sparkles size={12} className="text-amber-300" /> Theme: {puzzle.theme}
            </p>
            <div
              className={cn('mt-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors', toneClasses[fb.tone])}
              aria-live="polite"
            >
              {fb.text}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button onClick={showHint} disabled={status !== 'playing' || game.busy}>
                <Lightbulb size={16} /> Hint
              </Button>
              <Button onClick={() => loadPuzzle(index)}>
                <RotateCcw size={16} /> Reset
              </Button>
              <Button onClick={showSolution} disabled={status === 'showing' && game.busy}>
                <Eye size={16} /> Solution
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button className="flex-1" onClick={() => loadPuzzle((index + PUZZLES.length - 1) % PUZZLES.length)}>
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button
                className="flex-1"
                variant={status === 'solved' ? 'primary' : 'secondary'}
                onClick={() => loadPuzzle((index + 1) % PUZZLES.length)}
              >
                {status === 'solved' ? 'Next Level' : 'Next'} <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Levels</h3>
              <span className="text-xs tabular-nums text-stone-400">
                <b className="text-stone-200">{solvedCount}</b>/{PUZZLES.length} solved
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/30 p-1" role="tablist" aria-label="Difficulty">
              {DIFFICULTIES.map((d) => {
                const list = levelsOf(d);
                const done = list.filter((p) => solved.includes(p.id)).length;
                const active = tab === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(d)}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-left transition',
                      active ? 'bg-white/[0.1] ring-1 ring-white/10' : 'hover:bg-white/[0.05]',
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-1">
                      <span className={cn('text-xs font-bold', DIFF_META[d].text)}>{d}</span>
                      <span className="text-[11px] tabular-nums text-stone-400">
                        {done}/{list.length}
                      </span>
                    </span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className={cn('block h-full rounded-full transition-all duration-500', DIFF_META[d].bar)}
                        style={{ width: `${(done / list.length) * 100}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5" role="tabpanel" aria-label={`${tab} levels`}>
              {PUZZLES.map((p, i) => {
                if (p.difficulty !== tab) return null;
                const done = solved.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={`Level ${i + 1}: ${p.title}`}
                    aria-label={`Level ${i + 1}: ${p.title}${done ? ' (solved)' : ''}`}
                    onClick={() => loadPuzzle(i)}
                    className={cn(
                      'relative grid h-10 place-items-center rounded-lg border text-sm font-bold transition hover:brightness-125',
                      done ? DIFF_META[p.difficulty].chip : 'border-white/10 bg-white/[0.04] text-stone-300',
                      i === index && 'ring-2 ring-amber-200 ring-offset-2 ring-offset-[#151a21]',
                    )}
                  >
                    {i + 1}
                    {done && (
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-stone-900">
                        <Check size={10} strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11px] leading-snug text-stone-500">
              <span className={cn('font-semibold italic', DIFF_META[tab].text)}>{DIFF_META[tab].tagalog}</span> ·{' '}
              {DIFF_META[tab].summary}
            </p>
          </div>

          <MoveLog
            entries={log}
            names={PUZZLE_NAMES}
            title="Puzzle Moves"
            emptyText="Make your move: White to play."
            className="max-h-[220px]"
          />
        </aside>
      </main>
      <Confetti active={celebrate} />
    </div>
  );
}

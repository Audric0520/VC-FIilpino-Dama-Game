import { useMemo, useState } from 'react';
import { BookOpen, Bot, ChevronDown, Play, Puzzle, Settings2, Users } from 'lucide-react';
import { boardFromSetup, initialBoard, type Rules, type Side } from '../game/engine';
import type { Level } from '../game/ai';
import { DIFFICULTIES, levelsOf, PUZZLES, type Difficulty } from '../game/puzzles';
import { DamaBoard } from '../components/Board';
import { Logo } from '../components/GameHeader';
import { Button, MiniDisc, SoundToggle, Toggle } from '../components/ui';
import { LEVEL_INFO } from './PlayScreen';
import { DIFF_META } from './PuzzleScreen';
import { cn } from '../utils/cn';

interface MenuProps {
  level: Level;
  setLevel: (l: Level) => void;
  humanSide: Side;
  setHumanSide: (s: Side) => void;
  rules: Rules;
  setRules: (r: Rules) => void;
  solved: string[];
  onPlayAI: () => void;
  onPlayPvP: () => void;
  onPuzzles: (difficulty?: Difficulty) => void;
  onRules: () => void;
}

function usePreviewBoard() {
  return useMemo(() => {
    try {
      const board = boardFromSetup('b1 d1 h1 a2 c2 g2 b3 f3 e4 g4 Kd7', 'a8 c8 g8 b7 f7 h7 a6 c6 g6 d5 h5 Kb5');
      const ids = board.map((v, i) => (v ? i + 1 : 0));
      return { board, ids };
    } catch {
      const board = initialBoard();
      return { board, ids: board.map((v, i) => (v ? i + 1 : 0)) };
    }
  }, []);
}

export function MenuScreen(props: MenuProps) {
  const { level, setLevel, humanSide, setHumanSide, rules, setRules, solved } = props;
  const solvedCount = solved.length;
  const [showRules, setShowRules] = useState(false);
  const preview = usePreviewBoard();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <span className="font-display text-lg font-bold text-stone-100">Filipino Dama</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={props.onRules}>
            <BookOpen size={16} /> How to play
          </Button>
          <SoundToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-6">
        <div className="slide-up">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/90">Philippine Checkers</p>
          <h1 className="gold-text mt-2 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Filipino Dama
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-300 sm:text-lg">
            The classic board game played on sidewalks, in barangay halls and on bottle-cap boards across the
            Philippines. Flying Damas, backward captures and jumps you <em>must</em> take.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Flying Dama kings', 'Backward captures', 'Mandatory jumps', `${PUZZLES.length} puzzle levels`].map((t) => (
              <span
                key={t}
                className="rounded-full border border-amber-200/15 bg-amber-100/[0.06] px-3 py-1 text-xs font-medium text-amber-100/90"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-10 hidden justify-center lg:flex" style={{ perspective: '1400px' }}>
            <div className="float-slow w-[400px]" style={{ transform: 'rotateX(24deg) rotateZ(-4deg)' }}>
              <DamaBoard board={preview.board} ids={preview.ids} showCoords={false} />
            </div>
          </div>
        </div>

        <div className="slide-up flex flex-col gap-4" style={{ animationDelay: '80ms' }}>
          {/* VS AI */}
          <section className="panel p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-stone-50">Play vs Computer</h2>
                <p className="text-sm text-stone-400">Face a minimax AI that looks ahead with alpha-beta search.</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Difficulty</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Difficulty">
                {(Object.keys(LEVEL_INFO) as Level[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={level === l}
                    onClick={() => setLevel(l)}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-left transition',
                      level === l
                        ? 'border-amber-300/60 bg-amber-400/15 shadow-[0_0_20px_-8px_rgba(251,191,36,0.8)]'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                    )}
                  >
                    <span className="block text-sm font-bold text-stone-100">{LEVEL_INFO[l].label}</span>
                    <span className="block text-[11px] italic text-amber-200/70">{LEVEL_INFO[l].tagalog}</span>
                    <span className="mt-0.5 hidden text-[11px] leading-tight text-stone-400 sm:block">{LEVEL_INFO[l].blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Play as</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Play as">
                {([1, 2] as Side[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={humanSide === s}
                    onClick={() => setHumanSide(s)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
                      humanSide === s
                        ? 'border-amber-300/60 bg-amber-400/15'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                    )}
                  >
                    <MiniDisc side={s} size={22} />
                    <span className="leading-tight">
                      <span className="block text-sm font-bold text-stone-100">{s === 1 ? 'White' : 'Black'}</span>
                      <span className="block text-[11px] text-stone-400">{s === 1 ? 'You move first' : 'Computer moves first'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" size="lg" className="mt-4 w-full" onClick={props.onPlayAI}>
              <Play size={18} /> Start Game
            </Button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* PvP */}
            <section className="panel flex flex-col p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
                  <Users size={20} />
                </div>
                <h2 className="font-display text-lg font-bold text-stone-50">Pass &amp; Play</h2>
              </div>
              <p className="mt-2 flex-1 text-sm text-stone-400">Two players, one device. Take turns as White and Black.</p>
              <Button className="mt-4 w-full" onClick={props.onPlayPvP}>
                <Play size={16} /> Play Local
              </Button>
            </section>

            {/* Puzzles */}
            <section className="panel flex flex-col p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <Puzzle size={20} />
                </div>
                <h2 className="font-display text-lg font-bold text-stone-50">Dama Puzzles</h2>
              </div>
              <p className="mt-2 text-sm text-stone-400">
                {PUZZLES.length} levels: find the best move in sacrifices, blockades and flying sweeps.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {DIFFICULTIES.map((d) => {
                  const list = levelsOf(d);
                  const done = list.filter((p) => solved.includes(p.id)).length;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => props.onPuzzles(d)}
                      title={`${d} levels (${DIFF_META[d].tagalog}): ${DIFF_META[d].summary}`}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-left transition hover:border-white/20 hover:bg-white/[0.09]"
                    >
                      <span className={cn('block text-[11px] font-bold', DIFF_META[d].text)}>{d}</span>
                      <span className="block text-[11px] tabular-nums text-stone-400">
                        {done}/{list.length}
                      </span>
                      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                        <span
                          className={cn('block h-full rounded-full', DIFF_META[d].bar)}
                          style={{ width: `${(done / list.length) * 100}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button className="mt-4 w-full" onClick={() => props.onPuzzles()}>
                <Play size={16} />
                {solvedCount === 0 ? 'Solve Puzzles' : solvedCount >= PUZZLES.length ? 'Replay Puzzles' : 'Continue Puzzles'}
              </Button>
            </section>
          </div>

          {/* Rule options */}
          <section className="panel p-2">
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.04]"
              aria-expanded={showRules}
            >
              <Settings2 size={18} className="text-stone-400" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-stone-100">Rule options</span>
                <span className="block text-xs text-stone-400">
                  {rules.crownMidCapture ? 'Instant crowning' : 'Crown at end of move'} ·{' '}
                  {rules.maxCapture ? 'Maximum capture required' : 'Any capture allowed'}
                </span>
              </span>
              <ChevronDown size={18} className={cn('text-stone-400 transition-transform', showRules && 'rotate-180')} />
            </button>
            {showRules && (
              <div className="fade-in space-y-1 px-1 pb-2 pt-1">
                <Toggle
                  checked={rules.crownMidCapture}
                  onChange={(v) => setRules({ ...rules, crownMidCapture: v })}
                  label="Instant crowning (standard)"
                  description="A man that reaches the far row mid-capture becomes a Dama at once and keeps jumping as a Dama. Turn off for the tournament rule: crowned only if the move ends there."
                />
                <Toggle
                  checked={rules.maxCapture}
                  onChange={(v) => setRules({ ...rules, maxCapture: v })}
                  label="Maximum capture rule (tournament)"
                  description="When several captures exist, you must take the sequence that captures the most pieces."
                />
                <p className="px-2 pt-1 text-[11px] text-stone-500">Applies to new games vs the computer and pass &amp; play. Puzzles always use the standard rules.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="pb-6 text-center text-xs text-stone-500">
        Dama · Philippine checkers · 8×8 board, flying kings, mandatory captures
      </footer>
    </div>
  );
}

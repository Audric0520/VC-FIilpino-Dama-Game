import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Bot, Handshake, Info, Lightbulb, Loader2, Sparkles, Swords, Trophy, Undo2, Users } from 'lucide-react';
import {
  countPieces,
  DRAW_QUIET_LIMIT,
  getOutcome,
  initialBoard,
  legalMoves,
  moveNotation,
  other,
  type Move,
  type Outcome,
  type Rules,
  type Side,
} from '../game/engine';
import { formatEvalCp, type Level, type PositionAnalysis } from '../game/ai';
import { requestAIMove, requestEval } from '../game/aiClient';
import { sfx } from '../game/sound';
import { makeSnapshot, useDamaGame, type CommitInfo, type RejectReason } from '../hooks/useDamaGame';
import { DamaBoard } from '../components/Board';
import type { Arrow } from '../components/BoardArrows';
import { EvalBar } from '../components/EvalBar';
import { CapturedScore, GameHeader } from '../components/GameHeader';
import { MoveLog, newLogId, type LogEntry } from '../components/MoveLog';
import { PlayerStrip } from '../components/PlayerStrip';
import { BoardToast, Button, Confetti, Crown, Modal, toneClasses, type ToastData, type Tone } from '../components/ui';
import { cn } from '../utils/cn';

export interface PlayConfig {
  mode: 'ai' | 'pvp';
  level: Level;
  humanSide: Side;
  rules: Rules;
}

export const LEVEL_INFO: Record<Level, { label: string; tagalog: string; blurb: string }> = {
  easy: { label: 'Easy', tagalog: 'Madali', blurb: 'Relaxed play, makes mistakes' },
  medium: { label: 'Medium', tagalog: 'Katamtaman', blurb: 'Looks a few moves ahead' },
  hard: { label: 'Hard', tagalog: 'Mahirap', blurb: 'Deep minimax search' },
};

const COLOR: Record<Side, string> = { 1: 'White', 2: 'Black' };

export function PlayScreen({ config, onMenu, onRules }: { config: PlayConfig; onMenu: () => void; onRules: () => void }) {
  const { mode, level, humanSide, rules } = config;
  const vsAI = mode === 'ai';
  const aiSide = other(humanSide);
  const names: Record<Side, string> = vsAI
    ? humanSide === 1
      ? { 1: 'You', 2: 'Computer' }
      : { 1: 'Computer', 2: 'You' }
    : { 1: 'Player 1', 2: 'Player 2' };

  const [log, setLog] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [thinking, setThinking] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [hint, setHint] = useState<Move | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [analysis, setAnalysis] = useState<PositionAnalysis | null>(null);
  const [evalBusy, setEvalBusy] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const overTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(overTimer.current);
    },
    [],
  );

  function showToast(text: string, tone: Tone, icon?: ReactNode) {
    setToast({ id: Date.now() + Math.random(), text, tone, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2100);
  }

  function resultTitle(oc: Outcome) {
    if (!oc.winner) return 'Draw!';
    if (vsAI) return oc.winner === humanSide ? 'You Win!' : 'Computer Wins!';
    return `Player ${oc.winner} Wins!`;
  }

  function resultReason(oc: Outcome) {
    if (!oc.winner)
      return oc.reason === 'all-dama'
        ? 'Tournament rule: every piece on the board is a Dama.'
        : `${DRAW_QUIET_LIMIT} consecutive Dama moves without a capture.`;
    const loser = other(oc.winner);
    return oc.reason === 'no-pieces' ? `${COLOR[loser]} has no pieces left.` : `${COLOR[loser]} has no legal moves left.`;
  }

  function handleCommit({ move, mover, after }: CommitInfo) {
    const entries: LogEntry[] = [
      {
        id: newLogId(),
        ply: after.ply,
        kind: 'move',
        side: mover,
        text: moveNotation(move),
        caps: move.captures.length,
        promo: move.promotes,
      },
    ];
    if (move.promotes) {
      entries.push({
        id: newLogId(),
        ply: after.ply,
        kind: 'event',
        text: `Dama Promoted! ${names[mover]} (${COLOR[mover]}) crowned a king.`,
        tone: 'gold',
        icon: 'crown',
      });
      showToast('Dama Promoted!', 'gold', <Crown className="h-5 w-5" />);
      sfx.promote();
    } else if (move.captures.length >= 2) {
      entries.push({
        id: newLogId(),
        ply: after.ply,
        kind: 'event',
        text: `Multi-capture! ${COLOR[mover]} took ${move.captures.length} pieces.`,
        tone: 'bad',
        icon: 'swords',
      });
      showToast(`${move.captures.length}× Multi-capture!`, 'bad', <Swords size={18} />);
    }

    const oc = getOutcome(after.board, after.turn, after.quiet, rules);
    if (oc) {
      entries.push({
        id: newLogId(),
        ply: after.ply,
        kind: 'event',
        text: `${resultTitle(oc)} ${resultReason(oc)}`,
        tone: oc.winner ? 'good' : 'info',
        icon: 'trophy',
      });
      if (!oc.winner) sfx.hint();
      else if (vsAI && oc.winner !== humanSide) sfx.lose();
      else sfx.win();
      clearTimeout(overTimer.current);
      overTimer.current = window.setTimeout(() => setOverOpen(true), 950);
    } else {
      const next = legalMoves(after.board, after.turn, rules);
      if (next.length && next[0].captures.length) {
        entries.push({
          id: newLogId(),
          ply: after.ply,
          kind: 'event',
          text: `Mandatory Capture Required: ${names[after.turn]} (${COLOR[after.turn]}) must jump.`,
          tone: 'warn',
          icon: 'warn',
        });
      }
    }
    setLog((l) => [...l, ...entries]);
    setHint(null);
  }

  function handleReject(reason: RejectReason) {
    sfx.error();
    if (reason === 'mandatory') showToast('Mandatory Capture Required!', 'warn', <AlertTriangle size={18} />);
    else if (reason === 'continue') showToast('Keep jumping! The capture must continue.', 'warn', <Swords size={18} />);
    else if (reason === 'no-moves') showToast('That piece has no legal moves.', 'info', <Info size={18} />);
    else showToast(vsAI ? "That's the computer's piece." : 'Not your piece: wait for your turn.', 'info', <Info size={18} />);
  }

  const game = useDamaGame({
    initial: () => makeSnapshot(initialBoard(), 1),
    rules,
    isHumanTurn: (turn) => !vsAI || turn === humanSide,
    onCommit: handleCommit,
    onReject: handleReject,
  });
  const { snap, outcome } = game;

  // --- Computer opponent -------------------------------------------------
  useEffect(() => {
    if (!vsAI || outcome || game.busy || snap.turn !== aiSide) return;
    let alive = true;
    const session = game.sessionRef.current;
    const playMove = game.playMove;
    setThinking(true);
    const t0 = performance.now();
    requestAIMove({ board: snap.board, side: aiSide, level, rules }).then((m) => {
      const wait = Math.max(0, 520 - (performance.now() - t0));
      window.setTimeout(() => {
        if (!alive || session !== game.sessionRef.current) return;
        setThinking(false);
        if (m) void playMove(m);
      }, wait);
    });
    return () => {
      alive = false;
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsAI, aiSide, level, rules, snap, outcome, game.busy]);

  // --- Evaluation bar --------------------------------------------------------
  // Re-analyse the position whenever it changes (vs Computer only). Runs in a
  // dedicated worker so the bar keeps updating while the AI thinks.
  useEffect(() => {
    if (!vsAI) return;
    const controller = new AbortController();
    setEvalBusy(true);
    requestEval({ board: snap.board, side: snap.turn, rules }, controller.signal).then((a) => {
      if (controller.signal.aborted) return;
      setAnalysis(a);
      setEvalBusy(false);
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsAI, snap, rules]);

  function addArrow(arrow: Arrow) {
    setArrows((prev) => [...prev.filter((a) => !(a.from === arrow.from && a.to === arrow.to)), arrow]);
  }

  function clearArrows() {
    setArrows([]);
  }

  // --- Actions -------------------------------------------------------------
  function restart() {
    clearTimeout(overTimer.current);
    setOverOpen(false);
    setLog([]);
    setHint(null);
    setThinking(false);
    setToast(null);
    setArrows([]);
    game.reset(makeSnapshot(initialBoard(), 1));
  }

  const canUndo = game.historyLen >= (vsAI && humanSide === 2 ? 2 : 1) && !game.animating;
  function undo() {
    clearTimeout(overTimer.current);
    setOverOpen(false);
    const s = vsAI ? game.undo((x) => x.turn === humanSide) : game.undo();
    if (s) {
      setLog((l) => l.filter((e) => e.ply <= s.ply));
      showToast('Move undone', 'info', <Undo2 size={18} />);
    }
    setHint(null);
    setThinking(false);
  }

  async function askHint() {
    if (!game.interactive || hintLoading) return;
    setHintLoading(true);
    const session = game.sessionRef.current;
    const ply = snap.ply;
    const m = await requestAIMove({ board: snap.board, side: snap.turn, level: 'hard', rules, timeMs: 800 });
    setHintLoading(false);
    if (!m || session !== game.sessionRef.current || ply !== game.snapRef.current.ply) return;
    setHint(m);
    sfx.hint();
    showToast(`Hint: ${moveNotation(m)}`, 'info', <Lightbulb size={18} />);
  }

  // --- Derived UI state ---------------------------------------------------
  const white = countPieces(snap.board, 1);
  const black = countPieces(snap.board, 2);
  const aiTurn = vsAI && snap.turn === aiSide && !outcome;
  const turnLabel = outcome
    ? resultTitle(outcome)
    : vsAI
      ? aiTurn
        ? 'Computer is thinking…'
        : 'Your turn'
      : `Player ${snap.turn}'s turn (${COLOR[snap.turn]})`;

  let status: { title: string; detail: string; tone: Tone; icon: ReactNode };
  if (outcome) {
    status = {
      title: resultTitle(outcome),
      detail: resultReason(outcome),
      tone: outcome.winner ? 'good' : 'info',
      icon: outcome.winner ? <Trophy size={20} /> : <Handshake size={20} />,
    };
  } else if (aiTurn) {
    status = {
      title: 'Computer is thinking…',
      detail: `${LEVEL_INFO[level].label} AI is choosing its move.`,
      tone: 'info',
      icon: <Loader2 size={20} className="animate-spin" />,
    };
  } else if (game.partial && !game.animating && !game.partial.move) {
    status = {
      title: 'Keep jumping!',
      detail: 'A multi-capture must continue. Click the next gold ring.',
      tone: 'warn',
      icon: <Swords size={20} />,
    };
  } else if (game.mustCapture) {
    status = {
      title: 'Mandatory Capture Required',
      detail: `${vsAI ? 'You' : names[snap.turn]} must capture. Pieces that can jump are pulsing orange.`,
      tone: 'warn',
      icon: <AlertTriangle size={20} />,
    };
  } else {
    status = {
      title: vsAI ? 'Your turn' : `${names[snap.turn]}'s turn`,
      detail: `Playing ${COLOR[snap.turn]}. Select a piece to see where it can move.`,
      tone: 'info',
      icon: <Sparkles size={20} />,
    };
  }

  const mustSquares = game.interactive && game.mustCapture && !game.partial ? game.movable : [];
  const flipped = vsAI && humanSide === 2;
  // Evaluation bar (Play vs Computer): the analysis score is from the side to move's perspective.
  const evalWhite = analysis ? (analysis.side === 1 ? analysis.winPercent : 100 - analysis.winPercent) : 50;
  const evalLabel = analysis ? formatEvalCp(analysis.side === humanSide ? analysis.cp : -analysis.cp) : '–';
  const topSide: Side = flipped ? 1 : 2;
  const bottomSide: Side = flipped ? 2 : 1;
  const sideSub = (s: Side) =>
    vsAI ? (s === aiSide ? `${LEVEL_INFO[level].label} AI · ${COLOR[s]}` : `${COLOR[s]}${s === 1 ? ' · moves first' : ''}`) : COLOR[s];
  const humanWon = !!outcome?.winner && (!vsAI || outcome.winner === humanSide);

  const strip = (s: Side) => (
    <PlayerStrip
      side={s}
      name={names[s]}
      sub={sideSub(s)}
      active={!outcome && snap.turn === s}
      thinking={vsAI && s === aiSide && thinking}
      pieces={(s === 1 ? white : black).total}
      kings={(s === 1 ? white : black).kings}
      captured={snap.captured[s]}
    />
  );

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader
        modeLabel={vsAI ? `Vs Computer · ${LEVEL_INFO[level].label}` : 'Pass & Play · 2 Players'}
        turnLabel={turnLabel}
        turnSide={outcome ? null : snap.turn}
        thinking={aiTurn}
        finished={!!outcome}
        score={<CapturedScore white={snap.captured[1]} black={snap.captured[2]} />}
        onRestart={restart}
        onMenu={onMenu}
        onRules={onRules}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-center lg:gap-7 lg:py-6">
        <section className="board-col flex flex-col gap-2.5 fade-in">
          {strip(topSide)}
          <div className="flex items-stretch gap-2.5">
            {vsAI && <EvalBar whitePercent={evalWhite} flipped={flipped} analyzing={evalBusy} label={evalLabel} />}
            <DamaBoard
              board={game.display.board}
              ids={game.display.ids}
              fading={game.display.fading}
              moverSq={game.display.moverSq}
              selected={game.selected}
              targets={game.interactive ? game.targets : []}
              victims={game.interactive ? game.victims : []}
              mustSquares={mustSquares}
              lastMove={game.busy ? null : snap.lastMove}
              hint={hint}
              flipped={flipped}
              interactive={game.interactive}
              clickable={game.interactive ? game.movable : []}
              shake={game.shake}
              promotedId={game.promotedId}
              onSquareClick={game.clickSquare}
              overlay={<BoardToast toast={toast} />}
              arrows={arrows}
              arrowsEnabled
              onArrowAdd={addArrow}
              onArrowsClear={clearArrows}
              className="min-w-0 flex-1"
            />
          </div>
          {strip(bottomSide)}
        </section>

        <aside className="flex w-full max-w-[600px] flex-col gap-3 lg:sticky lg:top-24 lg:w-[360px] lg:max-w-none">
          <div className={cn('panel flex items-start gap-3 border p-4', toneClasses[status.tone])} aria-live="polite">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/25">{status.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Status</p>
              <h2 className="font-display text-lg font-bold leading-tight">{status.title}</h2>
              <p className="mt-0.5 text-sm opacity-85">{status.detail}</p>
            </div>
          </div>

          <div className="panel flex flex-wrap items-center gap-2 p-3">
            <Button onClick={undo} disabled={!canUndo} className="flex-1">
              <Undo2 size={16} /> Undo
            </Button>
            <Button onClick={askHint} disabled={!game.interactive || hintLoading} className="flex-1">
              {hintLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />} Hint
            </Button>
            <div className="flex w-full items-center justify-between gap-2 px-1 pt-1 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                {vsAI ? <Bot size={14} /> : <Users size={14} />}
                {vsAI ? `${LEVEL_INFO[level].label} · ${LEVEL_INFO[level].tagalog}` : 'Local two-player'}
              </span>
              <span>
                {rules.maxCapture ? 'Max capture' : 'Free capture'} · {rules.crownMidCapture ? 'Instant crown' : 'Crown at end'} ·{' '}
                {rules.allDamaDraw ? 'All-Dama draw' : 'No all-Dama draw'}
              </span>
            </div>
          </div>

          <MoveLog entries={log} names={names} className="max-h-[360px] lg:max-h-[calc(100svh-360px)]" />
        </aside>
      </main>

      <Modal open={overOpen && !!outcome} onClose={() => setOverOpen(false)} labelledBy="result-title">
        {outcome && (
          <div className="px-6 pb-6 pt-8 text-center">
            <div
              className={cn(
                'pop-in mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl',
                humanWon ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-stone-300',
              )}
            >
              {outcome.winner ? <Trophy size={32} /> : <Handshake size={32} />}
            </div>
            <h2 id="result-title" className="gold-text font-display text-4xl font-bold">
              {resultTitle(outcome)}
            </h2>
            <p className="mt-2 text-stone-300">{resultReason(outcome)}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              {[
                ['Moves', String(snap.ply)],
                ['White captured', String(snap.captured[1])],
                ['Black captured', String(snap.captured[2])],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3">
                  <div className="text-2xl font-bold tabular-nums text-stone-100">{v}</div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-400">{k}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="primary" size="lg" onClick={restart}>
                Play Again
              </Button>
              <Button size="lg" onClick={() => setOverOpen(false)}>
                View Board
              </Button>
              <Button variant="ghost" size="lg" onClick={onMenu}>
                Main Menu
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Confetti active={overOpen && humanWon} />
    </div>
  );
}

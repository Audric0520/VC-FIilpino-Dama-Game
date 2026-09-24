import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyMove,
  belongsTo,
  DARK_SQUARES,
  getOutcome,
  isKing,
  legalMoves,
  nextQuietCount,
  other,
  promotionRow,
  row,
  type Board,
  type Move,
  type Outcome,
  type Rules,
  type Side,
} from '../game/engine';
import { sfx } from '../game/sound';

export interface Snapshot {
  board: Board;
  /** Stable piece ids per square (0 = empty), used to animate pieces. */
  ids: number[];
  turn: Side;
  quiet: number;
  /** Pieces captured BY each side. */
  captured: Record<Side, number>;
  lastMove: Move | null;
  ply: number;
}

export interface CommitInfo {
  move: Move;
  mover: Side;
  before: Snapshot;
  after: Snapshot;
}

export type RejectReason = 'mandatory' | 'no-moves' | 'continue' | 'not-yours';

export const HOP_MS = 290;

export function makeSnapshot(board: Board, turn: Side = 1): Snapshot {
  const ids = board.map(() => 0);
  let n = 1;
  for (const sq of DARK_SQUARES) if (board[sq]) ids[sq] = n++;
  return { board: board.slice(), ids, turn, quiet: 0, captured: { 1: 0, 2: 0 }, lastMove: null, ply: 0 };
}

export function nextSnapshot(s: Snapshot, m: Move): Snapshot {
  const ids = s.ids.slice();
  const id = ids[m.from];
  ids[m.from] = 0;
  for (const c of m.captures) ids[c] = 0;
  ids[m.path[m.path.length - 1]] = id;
  const captured = { ...s.captured };
  captured[s.turn] += m.captures.length;
  return {
    board: applyMove(s.board, m),
    ids,
    turn: other(s.turn),
    quiet: nextQuietCount(s.board, m, s.quiet),
    captured,
    lastMove: m,
    ply: s.ply + 1,
  };
}

const prefixMatch = (path: number[], prefix: number[]) => prefix.every((p, i) => path[i] === p);

interface Partial {
  from: number;
  path: number[];
  move?: Move;
}

interface Options {
  initial: () => Snapshot;
  rules: Rules;
  /** Whether a human may currently move pieces for `turn`. */
  isHumanTurn: (turn: Side) => boolean;
  /** Extra lock (e.g. puzzle feedback in progress). */
  locked?: boolean;
  onCommit?: (info: CommitInfo) => void;
  onReject?: (reason: RejectReason, sq: number) => void;
}

export function useDamaGame(opts: Options) {
  const [snap, setSnapState] = useState<Snapshot>(opts.initial);
  const snapRef = useRef(snap);
  const history = useRef<Snapshot[]>([]);
  const [historyLen, setHistoryLen] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [partial, setPartial] = useState<Partial | null>(null);
  const [animating, setAnimating] = useState(false);
  const [shake, setShake] = useState<{ sq: number; key: number } | null>(null);
  const [promotedId, setPromotedId] = useState<number | null>(null);
  const sessionRef = useRef(0);
  const timers = useRef<number[]>([]);
  const resolvers = useRef<Set<(ok: boolean) => void>>(new Set());
  const cbRef = useRef(opts);
  cbRef.current = opts;

  const setSnap = (s: Snapshot) => {
    snapRef.current = s;
    setSnapState(s);
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  };

  const cancelAll = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    resolvers.current.forEach((r) => r(false));
    resolvers.current.clear();
    sessionRef.current++;
    setPartial(null);
    setSelected(null);
    setAnimating(false);
  };

  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  const rules = opts.rules;
  const legal = useMemo(() => legalMoves(snap.board, snap.turn, rules), [snap, rules]);
  const outcome: Outcome | null = useMemo(
    () => getOutcome(snap.board, snap.turn, snap.quiet, rules),
    [snap, rules],
  );
  const mustCapture = legal.length > 0 && legal[0].captures.length > 0;
  const movable = useMemo(() => Array.from(new Set(legal.map((m) => m.from))), [legal]);
  const busy = animating || partial !== null;
  const humanTurn = opts.isHumanTurn(snap.turn);
  const interactive = humanTurn && !animating && !outcome && !opts.locked;

  // Candidate moves for the current selection / partial capture path.
  const activeFrom = partial ? partial.from : selected;
  const step = partial ? partial.path.length : 0;
  const candidates = useMemo(
    () =>
      activeFrom === null || (partial && partial.move)
        ? []
        : legal.filter((m) => m.from === activeFrom && (!partial || prefixMatch(m.path, partial.path))),
    [legal, activeFrom, partial],
  );
  const targets = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const m of candidates) if (m.path.length > step) map.set(m.path[step], m.captures.length > 0);
    return Array.from(map, ([sq, capture]) => ({ sq, capture }));
  }, [candidates, step]);
  const victims = useMemo(() => {
    const set = new Set<number>();
    for (const m of candidates) if (m.captures.length > step) set.add(m.captures[step]);
    return Array.from(set);
  }, [candidates, step]);

  // Board as displayed (mid-move positions, pieces being captured fade out).
  const display = useMemo(() => {
    if (!partial || partial.path.length === 0) {
      return { board: snap.board, ids: snap.ids, fading: [] as number[], moverSq: partial ? partial.from : null };
    }
    const b = snap.board.slice();
    const ids = snap.ids.slice();
    const v = b[partial.from];
    const id = ids[partial.from];
    b[partial.from] = 0;
    ids[partial.from] = 0;
    const cur = partial.path[partial.path.length - 1];
    const ref =
      partial.move ?? legal.find((m) => m.from === partial.from && prefixMatch(m.path, partial.path));
    const fading = ref && ref.captures.length ? ref.captures.slice(0, partial.path.length) : [];
    let nv = v;
    const side: Side = v > 0 ? 1 : 2;
    if (
      !isKing(v) &&
      ref &&
      ref.captures.length &&
      rules.crownMidCapture &&
      partial.path.some((p) => row(p) === promotionRow(side))
    ) {
      nv = v * 2;
    }
    b[cur] = nv;
    ids[cur] = id;
    return { board: b, ids, fading, moverSq: cur };
  }, [snap, partial, legal, rules]);

  function commit(move: Move) {
    const before = snapRef.current;
    const after = nextSnapshot(before, move);
    history.current.push(before);
    setHistoryLen(history.current.length);
    setSnap(after);
    setPartial(null);
    setSelected(null);
    setAnimating(false);
    if (move.promotes) {
      const pid = after.ids[move.path[move.path.length - 1]];
      setPromotedId(pid);
      schedule(() => setPromotedId(null), 1000);
    }
    cbRef.current.onCommit?.({ move, mover: before.turn, before, after });
  }

  function reject(reason: RejectReason, sq: number) {
    setShake({ sq, key: Date.now() });
    schedule(() => setShake(null), 450);
    cbRef.current.onReject?.(reason, sq);
  }

  function advance(sq: number) {
    const from = partial ? partial.from : (selected as number);
    const path = partial ? [...partial.path, sq] : [sq];
    const matching = legal.filter((m) => m.from === from && prefixMatch(m.path, path));
    if (!matching.length) return;
    const complete = matching.find((m) => m.path.length === path.length);
    setSelected(from);
    setPartial({ from, path });
    if (matching[0].captures.length) sfx.capture();
    else sfx.move();
    if (complete) {
      setAnimating(true);
      const session = sessionRef.current;
      schedule(() => {
        if (session === sessionRef.current) commit(complete);
      }, HOP_MS + 40);
    }
  }

  function clickSquare(sq: number) {
    if (!interactive) return;
    const v = snap.board[sq];
    if (partial) {
      if (targets.some((t) => t.sq === sq)) advance(sq);
      else reject('continue', partial.path[partial.path.length - 1]);
      return;
    }
    if (selected !== null && targets.some((t) => t.sq === sq)) {
      advance(sq);
      return;
    }
    if (v !== 0 && belongsTo(v, snap.turn)) {
      if (movable.includes(sq)) {
        setSelected(sq === selected ? null : sq);
        sfx.select();
      } else {
        setSelected(null);
        reject(mustCapture ? 'mandatory' : 'no-moves', sq);
      }
      return;
    }
    if (v !== 0) {
      setSelected(null);
      reject('not-yours', sq);
      return;
    }
    setSelected(null);
  }

  /** Animate a complete move hop by hop, then commit it. Resolves false if cancelled. */
  function playMove(move: Move, preDelay = 160): Promise<boolean> {
    return new Promise((resolve) => {
      resolvers.current.add(resolve);
      const done = (ok: boolean) => {
        resolvers.current.delete(resolve);
        resolve(ok);
      };
      const session = sessionRef.current;
      setAnimating(true);
      setSelected(move.from);
      setPartial({ from: move.from, path: [], move });
      let i = 0;
      const hop = () => {
        if (session !== sessionRef.current) return;
        i++;
        setPartial({ from: move.from, path: move.path.slice(0, i), move });
        if (move.captures.length) sfx.capture();
        else sfx.move();
        if (i < move.path.length) schedule(hop, HOP_MS + 60);
        else
          schedule(() => {
            if (session !== sessionRef.current) return;
            commit(move);
            done(true);
          }, HOP_MS + 40);
      };
      schedule(hop, preDelay);
    });
  }

  function reset(s: Snapshot) {
    cancelAll();
    history.current = [];
    setHistoryLen(0);
    setPromotedId(null);
    setShake(null);
    setSnap(s);
  }

  /** Undo at least one ply, continuing until `until(snapshot)` holds (or history runs out). */
  function undo(until?: (s: Snapshot) => boolean): Snapshot | null {
    if (!history.current.length) return null;
    cancelAll();
    let s = history.current.pop() as Snapshot;
    while (until && !until(s) && history.current.length) s = history.current.pop() as Snapshot;
    setHistoryLen(history.current.length);
    setSnap(s);
    return s;
  }

  return {
    snap,
    snapRef,
    sessionRef,
    legal,
    outcome,
    mustCapture,
    movable,
    selected,
    partial,
    targets,
    victims,
    display,
    animating,
    busy,
    interactive,
    humanTurn,
    shake,
    promotedId,
    historyLen,
    clickSquare,
    playMove,
    reset,
    undo,
  };
}

export type DamaGame = ReturnType<typeof useDamaGame>;

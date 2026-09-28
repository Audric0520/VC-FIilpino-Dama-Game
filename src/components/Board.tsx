import { useMemo, type ReactNode } from 'react';
import { FILES, isDarkSquare, isKing, squareName, toSq, type Board as BoardT, type Move } from '../game/engine';
import { cn } from '../utils/cn';
import { BoardArrows, type Arrow } from './BoardArrows';
import { Crown } from './ui';

export interface BoardProps {
  board: BoardT;
  ids: number[];
  fading?: number[];
  moverSq?: number | null;
  selected?: number | null;
  targets?: { sq: number; capture: boolean }[];
  victims?: number[];
  mustSquares?: number[];
  lastMove?: Move | null;
  hint?: { from: number; path: number[] } | null;
  flipped?: boolean;
  interactive?: boolean;
  clickable?: number[];
  shake?: { sq: number; key: number } | null;
  promotedId?: number | null;
  onSquareClick?: (sq: number) => void;
  overlay?: ReactNode;
  showCoords?: boolean;
  className?: string;
  /** Annotation arrows drawn over the board (see BoardArrows). */
  arrows?: Arrow[];
  /** Enables right-drag arrow drawing and click-to-clear. */
  arrowsEnabled?: boolean;
  onArrowAdd?: (arrow: Arrow) => void;
  onArrowsClear?: () => void;
}

interface Cell {
  dr: number;
  dc: number;
  sq: number;
  dark: boolean;
}

export function DamaBoard({
  board,
  ids,
  fading = [],
  moverSq = null,
  selected = null,
  targets = [],
  victims = [],
  mustSquares = [],
  lastMove = null,
  hint = null,
  flipped = false,
  interactive = false,
  clickable = [],
  shake = null,
  promotedId = null,
  onSquareClick,
  overlay,
  showCoords = true,
  className,
  arrows = [],
  arrowsEnabled = false,
  onArrowAdd,
  onArrowsClear,
}: BoardProps) {
  const cells = useMemo(() => {
    const out: Cell[] = [];
    for (let dr = 0; dr < 8; dr++)
      for (let dc = 0; dc < 8; dc++) {
        const r = flipped ? 7 - dr : dr;
        const c = flipped ? 7 - dc : dc;
        out.push({ dr, dc, sq: toSq(r, c), dark: isDarkSquare(r, c) });
      }
    return out;
  }, [flipped]);

  const cellSquares = useMemo(() => cells.map((c) => c.sq), [cells]);

  const pieces = useMemo(() => {
    const list: { sq: number; v: number; id: number }[] = [];
    for (let sq = 0; sq < 64; sq++) if (board[sq]) list.push({ sq, v: board[sq], id: ids[sq] || 1000 + sq });
    return list.sort((a, b) => a.id - b.id);
  }, [board, ids]);

  const targetMap = new Map(targets.map((t) => [t.sq, t.capture]));
  const lastSquares = new Set<number>();
  const lastEnds = new Set<number>();
  if (lastMove) {
    lastEnds.add(lastMove.from);
    lastEnds.add(lastMove.path[lastMove.path.length - 1]);
    lastMove.path.forEach((p) => lastSquares.add(p));
  }
  const hintSquares = new Set<number>(hint ? [hint.from, ...hint.path] : []);
  const clickableSet = new Set(clickable);

  const pos = (sq: number) => {
    const r = sq >> 3;
    const c = sq & 7;
    return { dr: flipped ? 7 - r : r, dc: flipped ? 7 - c : c };
  };

  return (
    <div className={cn('board-wrap', className)}>
    <div className="board-frame select-none">
      <BoardArrows
        squares={cellSquares}
        arrows={arrows}
        enabled={arrowsEnabled}
        onAdd={onArrowAdd}
        onClear={onArrowsClear}
      >
      <div className="board-surface relative aspect-square w-full">
        {/* Squares */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {cells.map(({ sq, dark, dr, dc }) => (
            <div
              key={sq}
              className={cn('relative', dark ? 'sq-dark' : 'sq-light')}
              style={
                dark
                  ? { backgroundPosition: `${(dc * 100) / 7}% ${(dr * 100) / 7}%` }
                  : { backgroundPosition: `${(sq * 37) % 100}% ${sq % 3 === 0 ? 41.5 : 21.6}%` }
              }
            >
              {lastEnds.has(sq) && <div className="absolute inset-0 bg-amber-300/30" />}
              {!lastEnds.has(sq) && lastSquares.has(sq) && <div className="absolute inset-0 bg-amber-300/15" />}
            </div>
          ))}
        </div>

        {/* Pieces */}
        <div className="pointer-events-none absolute inset-0">
          {pieces.map(({ sq, v, id }) => {
            const { dr, dc } = pos(sq);
            const king = isKing(v);
            const white = v > 0;
            const capturing = fading.includes(sq);
            const isMover = moverSq === sq;
            const lifted = (selected === sq && moverSq === null) || isMover;
            return (
              <div
                key={id}
                className={cn('piece', isMover && 'moving', capturing && 'capturing')}
                style={{ transform: `translate(${dc * 100}%, ${dr * 100}%)` }}
              >
                {mustSquares.includes(sq) && !lifted && <div className="must-ring" />}
                <div
                  key={shake && shake.sq === sq ? shake.key : 'd'}
                  className={cn(
                    'disc',
                    white ? 'disc-white' : 'disc-black',
                    king && 'king',
                    lifted && !capturing && 'lifted',
                    shake && shake.sq === sq && 'shake',
                  )}
                >
                  {king && <Crown className={cn('crown', promotedId === id && 'crown-pop')} />}
                </div>
                {capturing && <div className="capture-burst" />}
                {promotedId === id && <div className="promo-burst" />}
              </div>
            );
          })}
        </div>

        {/* Markers & click targets */}
        <div className="absolute inset-0 z-10 grid grid-cols-8 grid-rows-8">
          {cells.map(({ sq, dark }) => {
            const isTarget = targetMap.has(sq);
            const isCapture = targetMap.get(sq);
            const canClick = interactive && dark && (isTarget || clickableSet.has(sq) || selected !== null);
            const v = board[sq];
            const label = `${squareName(sq)}${v ? `, ${v > 0 ? 'white' : 'black'} ${isKing(v) ? 'Dama' : 'man'}` : ''}${isTarget ? ', valid move' : ''}`;
            return dark ? (
              <button
                key={sq}
                type="button"
                aria-label={label}
                tabIndex={interactive && (isTarget || clickableSet.has(sq)) ? 0 : -1}
                onClick={() => onSquareClick?.(sq)}
                className={cn(
                  'relative grid place-items-center outline-none focus-visible:ring-2 focus-visible:ring-sky-300',
                  canClick ? 'cursor-pointer' : 'cursor-default',
                  selected === sq && moverSq === null && 'sel-square',
                )}
              >
                {isTarget && (isCapture ? <span className="capture-target" /> : <span className="move-dot" />)}
                {victims.includes(sq) && <span className="victim-mark" />}
                {hintSquares.has(sq) && <span className="hint-mark" />}
              </button>
            ) : (
              <div key={sq} />
            );
          })}
        </div>
        {overlay}
      </div>
      </BoardArrows>

      {showCoords && (
        <>
          <div className="pointer-events-none absolute bottom-0 left-[4.6cqw] right-[4.6cqw] flex h-[4.6cqw] items-center">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="coord flex-1 text-center">
                {FILES[flipped ? 7 - i : i]}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-[4.6cqw] left-0 top-[4.6cqw] flex w-[4.6cqw] flex-col">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="coord flex flex-1 items-center justify-center">
                {flipped ? i + 1 : 8 - i}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
}

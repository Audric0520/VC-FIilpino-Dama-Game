import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';

export type ArrowColor = 'blue' | 'red';

export interface Arrow {
  /** Engine square the arrow starts on. */
  from: number;
  /** Engine square the arrow points to. */
  to: number;
  color: ArrowColor;
}

export interface BoardArrowsProps {
  /** Engine square at each display cell, row-major in *display* order (respects flipping). */
  squares: number[];
  arrows?: Arrow[];
  enabled?: boolean;
  onAdd?: (arrow: Arrow) => void;
  onClear?: () => void;
  className?: string;
  children: ReactNode;
}

interface DragState {
  from: number;
  pointerId: number;
  shift: boolean;
  moved: boolean;
}

const STROKE: Record<ArrowColor, string> = {
  blue: 'rgba(56, 189, 248, 0.92)',
  red: 'rgba(239, 68, 68, 0.92)',
};

/**
 * Wraps the board surface and layers custom annotation arrows over it.
 * Right-drag draws a blue arrow, Shift + right-drag draws a red one,
 * and a plain left click or right click clears every arrow.
 */
export function BoardArrows({
  squares,
  arrows = [],
  enabled = false,
  onAdd,
  onClear,
  className,
  children,
}: BoardArrowsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [preview, setPreview] = useState<Arrow | null>(null);

  const centerOf = (sq: number) => {
    const idx = Math.max(0, squares.indexOf(sq));
    const c = idx % 8;
    const r = (idx - c) / 8;
    return { x: c * 12.5 + 6.25, y: r * 12.5 + 6.25 };
  };

  const sqAtClient = (clientX: number, clientY: number): number | null => {
    const el = rootRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || x >= 1 || y < 0 || y >= 1) return null;
    return squares[Math.floor(y * 8) * 8 + Math.floor(x * 8)] ?? null;
  };

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || e.button !== 2) return;
    const sq = sqAtClient(e.clientX, e.clientY);
    if (sq === null) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { from: sq, pointerId: e.pointerId, shift: e.shiftKey, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!enabled || !drag || e.pointerId !== drag.pointerId) return;
    drag.shift = e.shiftKey;
    const sq = sqAtClient(e.clientX, e.clientY);
    if (sq === null || sq === drag.from) {
      setPreview((p) => (p ? null : p));
      return;
    }
    drag.moved = true;
    const color: ArrowColor = drag.shift ? 'red' : 'blue';
    setPreview((p) => (p && p.from === drag.from && p.to === sq && p.color === color ? p : { from: drag.from, to: sq, color }));
  }

  function finishDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (preview) {
      onAdd?.(preview);
      setPreview(null);
      return;
    }
    // A right click without dragging clears every arrow.
    if (!drag.moved && arrows.length > 0) onClear?.();
  }

  function handleCancel(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      dragRef.current = null;
      setPreview(null);
    }
  }

  // A plain left click clears every arrow (the click itself still bubbles
  // through, so piece selection keeps working).
  function handleClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (!enabled || arrows.length === 0) return;
    if (e.button === 0) onClear?.();
  }

  const drawn = preview && !arrows.some((a) => a.from === preview.from && a.to === preview.to && a.color === preview.color)
    ? [...arrows, preview]
    : arrows;

  return (
    <div
      ref={rootRef}
      className={cn('board-arrows', className)}
      onPointerDown={enabled ? handlePointerDown : undefined}
      onPointerMove={enabled ? handlePointerMove : undefined}
      onPointerUp={enabled ? finishDrag : undefined}
      onPointerCancel={enabled ? handleCancel : undefined}
      onClickCapture={enabled ? handleClickCapture : undefined}
      onContextMenu={enabled ? (e) => e.preventDefault() : undefined}
    >
      {children}
      {enabled && (
        <svg className="arrows-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker
              id="arrowhead-blue"
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              markerHeight="7"
              refX="5.5"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7 Z" fill={STROKE.blue} />
            </marker>
            <marker
              id="arrowhead-red"
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              markerHeight="7"
              refX="5.5"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7 Z" fill={STROKE.red} />
            </marker>
          </defs>
          {drawn.map((a, i) => {
            const p1 = centerOf(a.from);
            const p2 = centerOf(a.to);
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const isPreview = preview !== null && i === drawn.length - 1 && a === preview;
            return (
              <line
                key={`${i}:${a.from}-${a.to}-${a.color}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x - ux * 4.5}
                y2={p2.y - uy * 4.5}
                stroke={STROKE[a.color]}
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity={isPreview ? 0.7 : 0.9}
                markerEnd={`url(#arrowhead-${a.color})`}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

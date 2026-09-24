import type { Side } from '../game/engine';
import { cn } from '../utils/cn';
import { Crown, MiniDisc } from './ui';

export function PlayerStrip({
  side,
  name,
  sub,
  active,
  thinking,
  pieces,
  kings,
  captured,
}: {
  side: Side;
  name: string;
  sub: string;
  active: boolean;
  thinking?: boolean;
  pieces: number;
  kings: number;
  captured: number;
}) {
  const opp: Side = side === 1 ? 2 : 1;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-300',
        active
          ? 'border-amber-300/40 bg-amber-400/[0.09] shadow-[0_0_28px_-10px_rgba(251,191,36,0.7)]'
          : 'border-white/[0.06] bg-black/25',
      )}
    >
      <MiniDisc side={side} size={26} />
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-100">
          <span className="truncate">{name}</span>
          {active && (
            <span className="shimmer whitespace-nowrap rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              {thinking ? 'Thinking…' : 'To move'}
            </span>
          )}
        </div>
        <div className="truncate text-xs text-stone-400">{sub}</div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3 text-xs text-stone-300">
        <span title="Pieces on the board">
          <b className="text-sm tabular-nums text-stone-100">{pieces}</b>
          <span className="hidden sm:inline"> pieces</span>
        </span>
        {kings > 0 && (
          <span className="flex items-center gap-1" title="Damas (kings)">
            <Crown className="h-4 w-4" />
            <b className="tabular-nums text-stone-100">{kings}</b>
          </span>
        )}
        <span className="flex items-center" title={`Captured ${captured} piece${captured === 1 ? '' : 's'}`}>
          <span className="flex -space-x-2">
            {Array.from({ length: Math.min(captured, 6) }, (_, i) => (
              <MiniDisc key={i} side={opp} size={14} className="ring-1 ring-black/40" />
            ))}
          </span>
          {captured > 0 && <b className="ml-1.5 tabular-nums text-stone-100">+{captured}</b>}
        </span>
      </div>
    </div>
  );
}

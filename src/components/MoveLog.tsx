import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, Info, ScrollText, Sparkles, Swords, Trophy } from 'lucide-react';
import type { Side } from '../game/engine';
import { cn } from '../utils/cn';
import { Crown, MiniDisc, toneClasses, type Tone } from './ui';

export interface LogEntry {
  id: number;
  ply: number;
  kind: 'move' | 'event';
  side?: Side;
  text: string;
  caps?: number;
  promo?: boolean;
  tone?: Tone;
  icon?: 'crown' | 'warn' | 'trophy' | 'swords' | 'info' | 'spark';
}

let logId = 1;
export const newLogId = () => logId++;

const ICONS: Record<NonNullable<LogEntry['icon']>, ReactNode> = {
  crown: <Crown className="h-4 w-4 shrink-0" />,
  warn: <AlertTriangle size={14} className="shrink-0" />,
  trophy: <Trophy size={14} className="shrink-0" />,
  swords: <Swords size={14} className="shrink-0" />,
  info: <Info size={14} className="shrink-0" />,
  spark: <Sparkles size={14} className="shrink-0" />,
};

export function MoveLog({
  entries,
  names,
  className,
  emptyText = 'No moves yet. White moves first.',
  title = 'Move Log',
}: {
  entries: LogEntry[];
  names: Record<Side, string>;
  className?: string;
  emptyText?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [entries.length]);
  const moves = entries.filter((e) => e.kind === 'move').length;

  return (
    <section className={cn('panel flex min-h-0 flex-col', className)} aria-label={title}>
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          <ScrollText size={14} /> {title}
        </h2>
        <span className="text-xs tabular-nums text-stone-500">
          {moves} {moves === 1 ? 'move' : 'moves'}
        </span>
      </div>
      <div ref={ref} className="nice-scroll min-h-[140px] flex-1 overflow-y-auto px-2 pb-2" role="log" aria-live="polite">
        {entries.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-stone-500">{emptyText}</p>
        ) : (
          entries.map((e) =>
            e.kind === 'move' ? (
              <div
                key={e.id}
                className="slide-up flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm odd:bg-white/[0.035]"
              >
                <span className="w-7 shrink-0 text-right text-xs tabular-nums text-stone-500">
                  {Math.ceil(e.ply / 2)}.
                </span>
                {e.side && <MiniDisc side={e.side} size={14} />}
                <span className="w-20 shrink-0 truncate text-xs text-stone-400">{e.side ? names[e.side] : ''}</span>
                <span className="min-w-0 truncate font-mono text-[13px] font-semibold text-stone-100">{e.text}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {e.caps ? (
                    <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-bold text-rose-200">
                      ×{e.caps}
                    </span>
                  ) : null}
                  {e.promo && <Crown className="h-4 w-4" />}
                </span>
              </div>
            ) : (
              <div
                key={e.id}
                className={cn(
                  'slide-up mx-1 my-1 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                  toneClasses[e.tone ?? 'info'],
                )}
              >
                {e.icon && ICONS[e.icon]}
                <span>{e.text}</span>
              </div>
            ),
          )
        )}
      </div>
    </section>
  );
}

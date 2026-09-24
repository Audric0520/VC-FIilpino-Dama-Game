import type { ReactNode } from 'react';
import { BookOpen, Home, Loader2, RotateCcw, Trophy } from 'lucide-react';
import type { Side } from '../game/engine';
import { cn } from '../utils/cn';
import { Button, Crown, IconButton, MiniDisc, SoundToggle } from './ui';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="wood-chip relative grid shrink-0 place-items-center rounded-xl shadow-lg ring-1 ring-amber-200/20"
      style={{ width: size, height: size }}
    >
      <span className="mini-disc mini-white grid place-items-center" style={{ width: size * 0.62, height: size * 0.62 }}>
        <Crown className="h-[62%] w-[62%]" />
      </span>
    </span>
  );
}

interface HeaderProps {
  modeLabel: string;
  turnLabel: string;
  turnSide: Side | null;
  thinking?: boolean;
  finished?: boolean;
  score: ReactNode;
  onRestart: () => void;
  restartLabel?: string;
  onMenu: () => void;
  onRules: () => void;
}

export function GameHeader({
  modeLabel,
  turnLabel,
  turnSide,
  thinking,
  finished,
  score,
  onRestart,
  restartLabel = 'Restart Game',
  onMenu,
  onRules,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0c1015]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={onMenu}
          className="order-1 mr-auto flex items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 lg:mr-0"
          aria-label="Back to main menu"
        >
          <Logo />
          <div className="leading-tight">
            <h1 className="gold-text font-display text-xl font-bold tracking-wide sm:text-2xl">Filipino Dama</h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 sm:text-[11px]">{modeLabel}</p>
          </div>
        </button>

        <div className="order-3 flex w-full items-center justify-between gap-2 lg:order-2 lg:mx-auto lg:w-auto lg:justify-center lg:gap-3">
          <div
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-colors',
              finished ? 'border-amber-300/40 bg-amber-400/15' : 'border-white/10 bg-white/[0.05]',
            )}
            aria-live="polite"
          >
            {finished ? (
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-amber-400/90 text-stone-900">
                <Trophy size={13} />
              </span>
            ) : turnSide ? (
              <MiniDisc side={turnSide} size={22} />
            ) : null}
            <span className="truncate text-sm font-semibold text-stone-100">{turnLabel}</span>
            {thinking && <Loader2 size={15} className="shrink-0 animate-spin text-amber-300" />}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm">
            {score}
          </div>
        </div>

        <div className="order-2 flex items-center gap-1.5 sm:gap-2 lg:order-3">
          <Button variant="primary" size="sm" onClick={onRestart}>
            <RotateCcw size={16} />
            <span className="hidden sm:inline">{restartLabel}</span>
            <span className="sm:hidden">Restart</span>
          </Button>
          <IconButton label="How to play" onClick={onRules}>
            <BookOpen size={18} />
          </IconButton>
          <SoundToggle />
          <IconButton label="Main menu" onClick={onMenu}>
            <Home size={18} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

export function CapturedScore({ white, black, label = 'Captured' }: { white: number; black: number; label?: string }) {
  return (
    <>
      <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-stone-400 sm:inline">{label}</span>
      <span className="flex items-center gap-1.5" title="Pieces captured by White">
        <MiniDisc side={1} size={16} />
        <span className="font-bold tabular-nums text-stone-100">{white}</span>
      </span>
      <span className="text-stone-600">:</span>
      <span className="flex items-center gap-1.5" title="Pieces captured by Black">
        <span className="font-bold tabular-nums text-stone-100">{black}</span>
        <MiniDisc side={2} size={16} />
      </span>
    </>
  );
}

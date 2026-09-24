import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { isSoundOn, setSoundOn, subscribeSound } from '../game/sound';
import type { Side } from '../game/engine';
import { cn } from '../utils/cn';

/** Shared SVG gradient definitions (rendered once in App). */
export function SvgDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.45" stopColor="#f6c343" />
          <stop offset="1" stopColor="#a86a12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M10 46 L6 20 L21 31 L32 12 L43 31 L58 20 L54 46 Z"
        fill="url(#crown-gold)"
        stroke="#4a2d06"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <rect x="10" y="48" width="44" height="7.5" rx="2.5" fill="url(#crown-gold)" stroke="#4a2d06" strokeWidth="3" />
      <circle cx="6" cy="19" r="4" fill="url(#crown-gold)" stroke="#4a2d06" strokeWidth="2.5" />
      <circle cx="32" cy="11" r="4.2" fill="url(#crown-gold)" stroke="#4a2d06" strokeWidth="2.5" />
      <circle cx="58" cy="19" r="4" fill="url(#crown-gold)" stroke="#4a2d06" strokeWidth="2.5" />
      <circle cx="32" cy="37" r="3.6" fill="#c0262d" stroke="#4a2d06" strokeWidth="1.8" />
    </svg>
  );
}

export function MiniDisc({ side, size = 18, king = false, className }: { side: Side; size?: number; king?: boolean; className?: string }) {
  return (
    <span
      className={cn('mini-disc inline-block', side === 1 ? 'mini-white' : 'mini-black', className)}
      style={{ width: size, height: size }}
    >
      {king && <Crown className="absolute left-[17%] top-[15%] h-[66%] w-[66%]" />}
    </span>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' &&
          'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-900 shadow-[0_6px_18px_-6px_rgba(245,158,11,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] hover:from-amber-200 hover:to-amber-400',
        variant === 'secondary' &&
          'border border-white/10 bg-white/[0.06] text-stone-100 hover:border-white/20 hover:bg-white/[0.11]',
        variant === 'ghost' && 'text-stone-300 hover:bg-white/[0.07] hover:text-white',
        variant === 'danger' && 'border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-stone-200 transition',
        'hover:border-white/20 hover:bg-white/[0.12] hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function useSoundOn() {
  const [on, setOn] = useState(isSoundOn());
  useEffect(() => subscribeSound(setOn), []);
  return on;
}

export function SoundToggle({ className }: { className?: string }) {
  const on = useSoundOn();
  return (
    <IconButton label={on ? 'Mute sounds' : 'Enable sounds'} onClick={() => setSoundOn(!on)} className={className}>
      {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </IconButton>
  );
}

export function Modal({
  open,
  onClose,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className={cn('pop-in panel relative max-h-[90vh] w-full max-w-lg overflow-hidden', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-amber-300/60 bg-amber-400/80' : 'border-white/15 bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-stone-100">{label}</span>
        {description && <span className="block text-xs leading-snug text-stone-400">{description}</span>}
      </span>
    </label>
  );
}

const CONFETTI_COLORS = ['#fcd34d', '#f59e0b', '#fef3c7', '#ef4444', '#3b82f6', '#10b981', '#f5f5f4'];

export function Confetti({ active, count = 110 }: { active: boolean; count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.4 + Math.random() * 2.2,
        dx: `${(Math.random() - 0.5) * 240}px`,
        rot: `${(Math.random() - 0.5) * 1440}deg`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
      })),
    // regenerate each time it's activated
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, count],
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              '--dx': p.dx,
              '--rot': p.rot,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export type Tone = 'info' | 'warn' | 'good' | 'gold' | 'bad';

export const toneClasses: Record<Tone, string> = {
  info: 'border-sky-300/30 bg-sky-500/15 text-sky-100',
  warn: 'border-orange-300/40 bg-orange-500/20 text-orange-50',
  good: 'border-emerald-300/40 bg-emerald-500/20 text-emerald-50',
  gold: 'border-amber-300/50 bg-amber-400/20 text-amber-50',
  bad: 'border-rose-300/40 bg-rose-500/20 text-rose-50',
};

export interface ToastData {
  id: number;
  text: string;
  tone: Tone;
  icon?: ReactNode;
}

export function BoardToast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className={cn(
        'toast pointer-events-none absolute left-1/2 top-[6%] z-30 flex max-w-[88%] items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold shadow-2xl backdrop-blur-md sm:text-base',
        toneClasses[toast.tone],
      )}
    >
      {toast.icon}
      <span className="truncate">{toast.text}</span>
    </div>
  );
}

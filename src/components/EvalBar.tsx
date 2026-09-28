import { cn } from '../utils/cn';

export interface EvalBarProps {
  /** 0-100: White's winning chances in percent. */
  whitePercent: number;
  /** True when the board is flipped (Black on the bottom). */
  flipped?: boolean;
  /** True while the engine is still analysing the position. */
  analyzing?: boolean;
  /** Small label under the bar, e.g. the formatted score from the player's point of view. */
  label?: string;
  className?: string;
}

/**
 * Vertical evaluation bar shown next to the board in Play vs Computer games.
 * The light section grows from the side where White sits and represents
 * White's winning chances.
 */
export function EvalBar({ whitePercent, flipped = false, analyzing = false, label, className }: EvalBarProps) {
  const p = Math.min(100, Math.max(0, whitePercent));
  return (
    <div className={cn('eval-bar-wrap', className)} role="img" aria-label={`Evaluation: White ${Math.round(p)}%`}>
      <div className={cn('eval-bar', flipped && 'eval-bar-flipped')}>
        <div className={cn('eval-bar-white', analyzing && 'thinking')} style={{ height: `${p}%` }} />
      </div>
      <span className="eval-bar-label">{label ?? `${Math.round(p)}%`}</span>
    </div>
  );
}

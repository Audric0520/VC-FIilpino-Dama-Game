import type { ReactNode } from 'react';
import { Ban, Crown as CrownIcon, Footprints, Grid3x3, Handshake, MousePointerClick, Swords, Trophy } from 'lucide-react';
import { DRAW_QUIET_LIMIT, type Rules } from '../game/engine';
import { Modal } from './ui';

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-400/15 text-amber-300">{icon}</div>
      <div className="min-w-0">
        <h3 className="font-semibold text-stone-100">{title}</h3>
        <div className="mt-0.5 space-y-1 text-sm leading-relaxed text-stone-300">{children}</div>
      </div>
    </div>
  );
}

export function RulesModal({ open, onClose, rules }: { open: boolean; onClose: () => void; rules: Rules }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl" labelledBy="rules-title">
      <div className="border-b border-white/10 px-6 pb-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">How to play</p>
        <h2 id="rules-title" className="gold-text font-display text-3xl font-bold">
          Filipino Dama Rules
        </h2>
      </div>
      <div className="nice-scroll max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
        <Section icon={<Grid3x3 size={16} />} title="Board & setup">
          <p>
            An 8×8 board with alternating light and dark squares. Play happens <b>only on the dark squares</b>. Each player
            starts with <b>12 pieces</b> on the dark squares of the three rows nearest to them.{' '}
            <b>White (Player 1) moves first.</b>
          </p>
        </Section>
        <Section icon={<Footprints size={16} />} title="Men (pawns)">
          <p>
            A man moves <b>one square diagonally forward</b> into an empty square. It captures by jumping over an adjacent
            enemy piece, <b>forward or backward</b>, onto the empty square directly behind it.
          </p>
        </Section>
        <Section icon={<Swords size={16} />} title="Mandatory & multiple captures">
          <p>
            If you can capture, you <b>must</b> capture. Non-capturing moves are blocked.{' '}
            {rules.maxCapture
              ? 'With the maximum-capture option on, you must choose the sequence that takes the most pieces.'
              : 'You may choose any available capture.'}
          </p>
          <p>
            If a jump lands where another jump is possible, the piece <b>must keep jumping</b> in the same turn. Captured
            pieces are removed when the move ends, and no piece can be jumped twice.
          </p>
        </Section>
        <Section icon={<CrownIcon size={16} />} title="Dama (king)">
          <p>
            A man that reaches the far row is <b>crowned instantly</b>
            {rules.crownMidCapture
              ? ', even in the middle of a capture, and keeps jumping as a Dama.'
              : '. (Option: during a capture it is only crowned if the move ends on the far row.)'}
          </p>
          <p>
            The Dama is a <b>flying king</b>: it moves any distance diagonally, forward or backward. It captures an enemy
            piece anywhere along a diagonal (with only empty squares in between) and lands on <b>any empty square</b> beyond
            it.
          </p>
        </Section>
        <Section icon={<Trophy size={16} />} title="Winning">
          <p>
            You win when your opponent has <b>no pieces left</b> or <b>no legal moves</b> on their turn.
          </p>
        </Section>
        <Section icon={<Handshake size={16} />} title="Draws">
          <p>
            {rules.allDamaDraw ? (
              <>
                <b>All-Dama draw (tournament rule, on):</b> the moment <b>every piece on the board is a Dama</b>, the
                game is immediately declared a draw.
              </>
            ) : (
              <>
                <b>All-Dama draw (tournament rule, off):</b> play continues even when every piece is a Dama, until one
                side wins or another draw rule applies.
              </>
            )}
          </p>
          <p>
            To prevent endless games, {DRAW_QUIET_LIMIT} consecutive moves made only by Damas with no capture is a draw.
          </p>
        </Section>
        <Section icon={<MousePointerClick size={16} />} title="Controls">
          <p>
            Click a piece to select it. <span className="text-emerald-300">Green dots</span> mark moves and{' '}
            <span className="text-amber-300">gold rings</span> mark capture landings. Pieces that can capture pulse{' '}
            <span className="text-orange-300">orange</span>. For a multi-capture, click each landing square in turn.
          </p>
        </Section>
        <Section icon={<Ban size={16} />} title="Blocked moves">
          <p>If you try to move a piece that is not allowed to move (for example, while a capture is mandatory), it shakes and a notice explains why.</p>
        </Section>
      </div>
    </Modal>
  );
}

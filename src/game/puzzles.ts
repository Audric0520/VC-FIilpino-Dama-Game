export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export type PuzzleGoal = { type: 'win'; moves: number } | { type: 'capture'; count: number };

export interface Puzzle {
  id: string;
  title: string;
  difficulty: Difficulty;
  goal: PuzzleGoal;
  /** White (Player 1) pieces, "K" prefix = Dama. White is always to move. */
  p1: string;
  /** Black (Player 2) pieces. */
  p2: string;
  theme: string;
  hint: string;
  lesson: string;
}

/**
 * 30 levels: 10 Easy, 10 Medium, 10 Hard (in this order).
 * Every position was found and verified with the exact solver in src/game/solver.ts using the
 * default rules: each has exactly one winning first move, or a single longest capture.
 * Run scripts/verify-puzzles.ts after editing.
 */
export const PUZZLES: Puzzle[] = [
  /* ------------------------------ EASY ------------------------------ */
  {
    id: 'triple-jump',
    title: 'Triple Jump',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 3 },
    p1: 'e7 f4 b4 b2',
    p2: 'b8 g5 e5 c5 e3 c3',
    theme: 'Multi-capture',
    hint: 'Find the man that can keep jumping. After its first jump to d4 it has three ways to continue, and only one leads to a third capture.',
    lesson: 'b2×d4×f6×h4. From d4 you could also jump to b6 or f2, but only the jump over e5 to f6 sets up the third capture.',
  },
  {
    id: 'backward-strike',
    title: 'Backward Strike',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'e5 a3 a1',
    p2: 'f6 d6 b6 f4 b4 b2',
    theme: 'Multi-capture',
    hint: 'Men may capture backward too. Look for a zig-zag route that goes up the board and comes back down.',
    lesson: 'a3×c5×e7×g5×e3 takes four. The last two jumps go backward, which men are allowed to do when capturing.',
  },
  {
    id: 'flying-dama',
    title: 'Flying Dama',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'c5 Ka1',
    p2: 'd6 g5 b4 g3 b2',
    theme: 'Flying king',
    hint: 'After jumping b2, your Dama may land on ANY empty square beyond it. Choose the landing that keeps the attack going.',
    lesson: 'a1×f6×h4×e1×a5. A flying Dama chooses where to land, and landing on f6 lines up the next three captures.',
  },
  {
    id: 'seal-escape',
    title: 'Seal the Escape',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'g7 d6 Ke3 b2 e1',
    p2: 'a3',
    theme: 'Blockade',
    hint: "Black's only legal move is a capture. What if its landing square were already occupied?",
    lesson:
      "Ke3–c1 plugs c1, the landing square of Black's only capture. A player with no legal moves loses, even with pieces left on the board.",
  },
  {
    id: 'zigzag-run',
    title: 'Zig-Zag Run',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'c5 e1 c1',
    p2: 'h6 d6 b6 b4 f2 d2',
    theme: 'Multi-capture',
    hint: 'Your man at the very back has the longest route: up the right-hand side of the board, then one jump back down.',
    lesson: 'e1×c3×a5×c7×e5 takes four: three jumps up the board to c7, then a backward jump over d6 to finish.',
  },
  {
    id: 'crown-continue',
    title: 'Crown and Continue',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'h6 f6 e5',
    p2: 'g7 e7 c7 g5 d4',
    theme: 'Instant crowning',
    hint: 'A man that reaches the far row in the middle of a capture is crowned instantly and keeps capturing as a Dama.',
    lesson: 'h6×f8 crowns the man, then the new Dama flies on ×c5×e3×h6 and finishes on its starting square.',
  },
  {
    id: 'less-is-more',
    title: 'Less Is More',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'g7 d6 c3 Kg1',
    p2: 'g3 h2 f2 d2',
    theme: 'Blockade',
    hint: 'The biggest capture is not the winning one. Find the capture that leaves every black man stuck.',
    lesson:
      'c3×e1! It takes only one piece, but now h2, g3 and f2 are all blocked, so Black has no legal move. Capturing two with the Dama would free the h2 man.',
  },
  {
    id: 'long-flights',
    title: 'Long Flights',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'c3 Ka3',
    p2: 'b6 g5 b4 g3 d2 b2',
    theme: 'Flying king',
    hint: 'After jumping b4, your Dama can land on any of four squares. Choose the one on the same diagonal as g5.',
    lesson: 'Ka3×e7×h4×f2×a7. Landing on e7 lines up g5, then g3, and a final long flight over b6 finishes the job.',
  },
  {
    id: 'corner-freeze',
    title: 'Corner Freeze',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'g7 c7 b6 g5 e5 Kc5',
    p2: 'b8 a7',
    theme: 'Blockade',
    hint: 'Both black men are boxed into the corner, and their only way out is a single jump. Fill the square where that jump would land.',
    lesson: "e5–d6 fills d6, the landing square of Black's only jump. Neither black man can move, so Black loses on the spot.",
  },
  {
    id: 'perfect-landing',
    title: 'The Perfect Landing',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'Ka7 h6 f6 e5',
    p2: 'g7 c5 h2',
    theme: 'Flying king',
    hint: 'Your Dama can capture c5 and land on any of four squares beyond it. One landing leaves Black without a legal move.',
    lesson:
      'Ka7×g1! Landing on g1 blocks the h2 man, and g7 is already jammed by your men on h6 and f6. Black cannot move and loses.',
  },

  /* ----------------------------- MEDIUM ----------------------------- */
  {
    id: 'crowning-sacrifice',
    title: 'The Crowning Sacrifice',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'g7 g5',
    p2: 'c7 d6 h4 d4 Kg3 c3',
    theme: 'Sacrifice',
    hint: 'Crown a Dama first, and remember that capturing is mandatory for Black too.',
    lesson:
      'g7–f8 crowns. Black is forced to capture h4×f6, and the new Dama sweeps f8×c5×f2×h4×d8×a5×d2, all six pieces in one turn.',
  },
  {
    id: 'long-march',
    title: 'The Long March',
    difficulty: 'Medium',
    goal: { type: 'capture', count: 5 },
    p1: 'Kh8 h4 f4',
    p2: 'b8 g7 c7 g5 c5 g3 e3 Ka3 d2',
    theme: 'Instant crowning',
    hint: 'Forget your Dama for once. One man can march all the way up the board: its first jump goes backward, and it is crowned before the last capture.',
    lesson:
      'h4×f2×d4×b6×d8×h4: a backward jump, two forward jumps, a crowning jump to d8, and a flying capture of g5 back to h4.',
  },
  {
    id: 'bait-crown',
    title: 'Bait and Crown',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'g5 g3',
    p2: 'g7 e7 h2 Kb2',
    theme: 'Decoy',
    hint: "Step up next to the g7 man. Black's forced capture on the other side is exactly what you want.",
    lesson: 'g5–h6! Black must play h2×f4. Then h6×f8 crowns mid-capture and the Dama sweeps on ×a3×c1×g5.',
  },
  {
    id: 'decoy-e5',
    title: 'Decoy on e5',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'c7 d4 Kb2',
    p2: 'f6 g5 f2 Kd2',
    theme: 'Decoy',
    hint: 'Your Dama on b2 is blocked by your own man on d4. Offer that man as bait so the capture opens the long diagonal.',
    lesson: 'd4–e5! forces f6×d4, and the Dama sweeps Kb2×f6×h4×e1×c3, capturing all four black pieces.',
  },
  {
    id: 'six-sweep',
    title: 'Six-Piece Sweep',
    difficulty: 'Medium',
    goal: { type: 'capture', count: 6 },
    p1: 'd6 Kb6 d2',
    p2: 'g7 e7 c7 e5 c5 b4 b2',
    theme: 'Flying king',
    hint: 'Your Dama on b6 has many first jumps, but only one route collects six pieces. Try starting down the long diagonal.',
    lesson: 'b6×d4×f6×d8×a5×c3×a1. Plan the whole route before making the first jump.',
  },
  {
    id: 'backward-avalanche',
    title: 'Backward Avalanche',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'f6 c5 a5 a1',
    p2: 'f8 Kf4 f2 d2',
    theme: 'Sacrifice',
    hint: "Offer a man on e7. Black's forced double jump lands right next to your a5 man, and men may capture backward.",
    lesson: 'f6–e7! forces f8×d6×b4. Then a5×c3×e1×g3×e5 captures all four black pieces, starting with two backward jumps.',
  },
  {
    id: 'smothered',
    title: 'Smothered Army',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'g3 d2 e1',
    p2: 'e5 h4 h2 f2 Kg1',
    theme: 'Blockade',
    hint: "Black's army is jammed into a corner. Give away one man so the capturing piece plugs the last gap.",
    lesson:
      'g3–f4! forces e5×g3. After a quiet d2–c3, every black piece is frozen. No legal moves means Black loses despite having five pieces.',
  },
  {
    id: 'hidden-path',
    title: 'Hidden Path',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'b6 g3 d2',
    p2: 'Ke7 g5 a5 d4',
    theme: 'Quiet move',
    hint: "Step next to g5 on the edge, where it cannot capture you. Black's forced reply adds one more piece to your capture route.",
    lesson:
      'g3–h4! Black must play a5×c7. Then h4×f6×d8 crowns mid-capture and the new Dama finishes ×b6×e3, taking all four pieces.',
  },
  {
    id: 'greedy-trap',
    title: 'The Greedy Trap',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'c3 g1',
    p2: 'f6 d6 h4 Kd4 f2 d2',
    theme: 'Capture choice',
    hint: "The four-piece capture is a trap. Capture only two, and let Black's forced reply line everything up for your other man.",
    lesson:
      'c3×e1×g3! forces h4×f2, and then g1×e3×c5×e7×g5 clears the board. Grabbing four pieces first would let Black hit back.',
  },
  {
    id: 'quiet-dama',
    title: 'The Quiet Dama',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'e7 Kg3 g1',
    p2: 'f8 b4 Ke3 b2',
    theme: 'Quiet move',
    hint: 'Your e7 man is bait for f8. Switch your Dama to the other end of its long diagonal, so that after the capture it jumps toward the black Dama instead of away from it.',
    lesson: 'Kg3–b8! Black must take f8×d6, and the Dama answers b8×f4×c1×a3×c5, capturing all four black pieces.',
  },

  /* ------------------------------ HARD ------------------------------ */
  {
    id: 'double-sacrifice',
    title: 'Double Sacrifice',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'd6 g3 b2',
    p2: 'b8 f6 Kb4 h2',
    theme: 'Sacrifice',
    hint: "Give away two men to drag Black's pieces onto a single zig-zag line.",
    lesson: 'd6–c7! b8×d6, b2–a3! h2×f4, and the a3 man finishes with a3×c5×e7×g5×e3.',
  },
  {
    id: 'seven-maze',
    title: 'Seven-Piece Maze',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 7 },
    p1: 'd6 Kb6 h2 b2',
    p2: 'f8 e7 Kc7 e5 c5 b4 g3 d2',
    theme: 'Flying king',
    hint: 'Start with the jump over c5. The winning route touches all four edges of the board, and only f8 survives.',
    lesson: 'Kb6×d4×f6×d8×a5×c3×e1×h4: a tour of all four edges that captures seven pieces, leaving only f8.',
  },
  {
    id: 'dama-retreat',
    title: 'Dama Retreat',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'Kf6 g3 a1',
    p2: 'c7 c5 Ke3 h2',
    theme: 'Quiet move',
    hint: "Pull your Dama back to the top edge, on c7's diagonal. Black's forced capture does not stop the sweep that follows.",
    lesson: 'Kf6–d8! After the forced h2×f4, d8×b6×d4×f2 takes three pieces, and the last black man falls on the next move.',
  },
  {
    id: 'decoy-c3',
    title: 'Decoy on c3',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'b2 g1 Kc1',
    p2: 'h8 Ke7 d4 b4',
    theme: 'Decoy',
    hint: 'Offer a man so that the capturing black piece lands right next to your Dama.',
    lesson: 'b2–c3! Black must take, and the man lands on d2 right beside your Dama: Kc1×e3×c5×f8 takes three. The last man cannot escape the Dama.',
  },
  {
    id: 'full-circle',
    title: 'Full Circle',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'c7 b6 a1',
    p2: 'h6 g5 a5 Kb4 g3',
    theme: 'Crowning',
    hint: "Crown at once. Black's forced capture drops a man on c7, and your new Dama can loop around the board and come back for it.",
    lesson:
      'c7–d8 crowns, a5×c7 is forced, and the Dama sweeps d8×a5×e1×h4×f6, a full circuit that clears four more pieces. The last man falls next move.',
  },
  {
    id: 'eight-sweep',
    title: 'Eight-Piece Sweep',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 8 },
    p1: 'Ke7 a5',
    p2: 'g7 f6 d6 b6 f4 Kd4 g3 h2 d2',
    theme: 'Flying king',
    hint: 'Start with the jump over f6. Every landing must line up the next jump, and in the end only one black man survives.',
    lesson: 'Ke7×h4×e1×b4×f8×h6×e3×c5×a7 captures eight pieces. Only the man on h2 survives.',
  },
  {
    id: 'twin-offers',
    title: 'Twin Offers',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'g7 Ke1 c1',
    p2: 'Kh8 c7 d4',
    theme: 'Sacrifice',
    hint: "Give Black two men, one after the other. Each forced capture pulls a black piece onto your Dama's route.",
    lesson: 'c1–d2 lets Black take h8×f6, then d2–e3! forces d4×f2, and Ke1×h4×d8×b6 captures all three pieces.',
  },
  {
    id: 'sweep-smother',
    title: 'Sweep and Smother',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'e5 Ka5 g1',
    p2: 'g7 c7 b6 Kg5 g3',
    theme: 'Sacrifice',
    hint: "Offer your e5 man. Black's forced capture opens a path for your Dama right through the black camp.",
    lesson:
      'e5–d6! forces c7×e5, then Ka5×c7×f4×h6×f8 takes four. The last man on g3 is doomed: it either walks into your g1 man or gets stuck on h2 with no legal move.',
  },
  {
    id: 'grand-combo',
    title: 'Grand Combination',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'g7 d4 b4',
    p2: 'a5 g3 Ka3',
    theme: 'Combination',
    hint: "Sacrifice first to drag the a5 man away, then crown a Dama and let Black's Dama take the bait.",
    lesson: "d4–c5! a5×c3, g7–f8 crowns, and once Black's Dama captures on c5, f8×b4×e1×h4 clears the board.",
  },
  {
    id: 'nine-sweep',
    title: 'Nine-Piece Sweep',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 9 },
    p1: 'Kf8',
    p2: 'g7 e7 b6 Kf4 d4 b4 g3 d2 b2',
    theme: 'Flying king',
    hint: 'Begin by jumping g7. Every landing square must keep the chain alive as the Dama circles the board.',
    lesson: 'f8×h6×e3×c1×a3×c5×f2×h4×d8×a5. Nine pieces in a single turn!',
  },
];

export const levelsOf = (d: Difficulty) => PUZZLES.filter((p) => p.difficulty === d);

export function goalText(goal: PuzzleGoal): string {
  if (goal.type === 'capture') return `Capture ${goal.count} pieces in a single turn.`;
  if (goal.moves === 1) return 'White to move and win in 1: leave Black with no pieces or no legal moves.';
  return `White to move and win in ${goal.moves} moves against any defense.`;
}

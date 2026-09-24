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
    p1: 'd7 c4 g4 g2',
    p2: 'g8 b5 d5 f5 d3 f3',
    theme: 'Multi-capture',
    hint: 'Find the man that can keep jumping. After its first jump to e4 it has three ways to continue, and only one leads to a third capture.',
    lesson: 'g2×e4×c6×a4. From e4 you could also jump to g6 or c2, but only the jump over d5 to c6 sets up the third capture.',
  },
  {
    id: 'backward-strike',
    title: 'Backward Strike',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'd5 h3 h1',
    p2: 'c6 e6 g6 c4 g4 g2',
    theme: 'Multi-capture',
    hint: 'Men may capture backward too. Look for a zig-zag route that goes up the board and comes back down.',
    lesson: 'h3×f5×d7×b5×d3 takes four. The last two jumps go backward, which men are allowed to do when capturing.',
  },
  {
    id: 'flying-dama',
    title: 'Flying Dama',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'f5 Kh1',
    p2: 'e6 b5 g4 b3 g2',
    theme: 'Flying king',
    hint: 'After jumping g2, your Dama may land on ANY empty square beyond it. Choose the landing that keeps the attack going.',
    lesson: 'h1×c6×a4×d1×h5. A flying Dama chooses where to land, and landing on c6 lines up the next three captures.',
  },
  {
    id: 'seal-escape',
    title: 'Seal the Escape',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'b7 e6 Kd3 g2 d1',
    p2: 'h3',
    theme: 'Blockade',
    hint: "Black's only legal move is a capture. What if its landing square were already occupied?",
    lesson:
      "Kd3–f1 plugs f1, the landing square of Black's only capture. A player with no legal moves loses, even with pieces left on the board.",
  },
  {
    id: 'zigzag-run',
    title: 'Zig-Zag Run',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'f5 d1 f1',
    p2: 'a6 e6 g6 g4 c2 e2',
    theme: 'Multi-capture',
    hint: 'Your man at the very back has the longest route: up the right-hand side of the board, then one jump back down.',
    lesson: 'd1×f3×h5×f7×d5 takes four: three jumps up the board to f7, then a backward jump over e6 to finish.',
  },
  {
    id: 'crown-continue',
    title: 'Crown and Continue',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'a6 c6 d5',
    p2: 'b7 d7 f7 b5 e4',
    theme: 'Instant crowning',
    hint: 'A man that reaches the far row in the middle of a capture is crowned instantly and keeps capturing as a Dama.',
    lesson: 'a6×c8 crowns the man, then the new Dama flies on ×f5×d3×a6 and finishes on its starting square.',
  },
  {
    id: 'less-is-more',
    title: 'Less Is More',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'b7 e6 f3 Kb1',
    p2: 'b3 a2 c2 e2',
    theme: 'Blockade',
    hint: 'The biggest capture is not the winning one. Find the capture that leaves every black man stuck.',
    lesson:
      'f3×d1! It takes only one piece, but now a2, b3 and c2 are all blocked, so Black has no legal move. Capturing two with the Dama would free the a2 man.',
  },
  {
    id: 'long-flights',
    title: 'Long Flights',
    difficulty: 'Easy',
    goal: { type: 'capture', count: 4 },
    p1: 'f3 Kh3',
    p2: 'g6 b5 g4 b3 e2 g2',
    theme: 'Flying king',
    hint: 'After jumping g4, your Dama can land on any of four squares. Choose the one on the same diagonal as b5.',
    lesson: 'Kh3×d7×a4×c2×h7. Landing on d7 lines up b5, then b3, and a final long flight over g6 finishes the job.',
  },
  {
    id: 'corner-freeze',
    title: 'Corner Freeze',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'b7 f7 g6 b5 d5 Kf5',
    p2: 'g8 h7',
    theme: 'Blockade',
    hint: 'Both black men are boxed into the corner, and their only way out is a single jump. Fill the square where that jump would land.',
    lesson: "d5–e6 fills e6, the landing square of Black's only jump. Neither black man can move, so Black loses on the spot.",
  },
  {
    id: 'perfect-landing',
    title: 'The Perfect Landing',
    difficulty: 'Easy',
    goal: { type: 'win', moves: 1 },
    p1: 'Kh7 a6 c6 d5',
    p2: 'b7 f5 a2',
    theme: 'Flying king',
    hint: 'Your Dama can capture f5 and land on any of four squares beyond it. One landing leaves Black without a legal move.',
    lesson:
      'Kh7×b1! Landing on b1 blocks the a2 man, and b7 is already jammed by your men on a6 and c6. Black cannot move and loses.',
  },

  /* ----------------------------- MEDIUM ----------------------------- */
  {
    id: 'crowning-sacrifice',
    title: 'The Crowning Sacrifice',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'b7 b5',
    p2: 'f7 e6 a4 e4 Kb3 f3',
    theme: 'Sacrifice',
    hint: 'Crown a Dama first, and remember that capturing is mandatory for Black too.',
    lesson:
      'b7–c8 crowns. Black is forced to capture a4×c6, and the new Dama sweeps c8×f5×c2×a4×e8×h5×e2, all six pieces in one turn.',
  },
  {
    id: 'long-march',
    title: 'The Long March',
    difficulty: 'Medium',
    goal: { type: 'capture', count: 5 },
    p1: 'Ka8 a4 c4',
    p2: 'g8 b7 f7 b5 f5 b3 d3 Kh3 e2',
    theme: 'Instant crowning',
    hint: 'Forget your Dama for once. One man can march all the way up the board: its first jump goes backward, and it is crowned before the last capture.',
    lesson:
      'a4×c2×e4×g6×e8×a4: a backward jump, two forward jumps, a crowning jump to e8, and a flying capture of b5 back to a4.',
  },
  {
    id: 'bait-crown',
    title: 'Bait and Crown',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'b5 b3',
    p2: 'b7 d7 a2 Kg2',
    theme: 'Decoy',
    hint: "Step up next to the b7 man. Black's forced capture on the other side is exactly what you want.",
    lesson: 'b5–a6! Black must play a2×c4. Then a6×c8 crowns mid-capture and the Dama sweeps on ×h3×f1×b5.',
  },
  {
    id: 'decoy-d5',
    title: 'Decoy on d5',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'f7 e4 Kg2',
    p2: 'c6 b5 c2 Ke2',
    theme: 'Decoy',
    hint: 'Your Dama on g2 is blocked by your own man on e4. Offer that man as bait so the capture opens the long diagonal.',
    lesson: 'e4–d5! forces c6×e4, and the Dama sweeps Kg2×c6×a4×d1×f3, capturing all four black pieces.',
  },
  {
    id: 'six-sweep',
    title: 'Six-Piece Sweep',
    difficulty: 'Medium',
    goal: { type: 'capture', count: 6 },
    p1: 'e6 Kg6 e2',
    p2: 'b7 d7 f7 d5 f5 g4 g2',
    theme: 'Flying king',
    hint: 'Your Dama on g6 has many first jumps, but only one route collects six pieces. Try starting down the long diagonal.',
    lesson: 'g6×e4×c6×e8×h5×f3×h1. Plan the whole route before making the first jump.',
  },
  {
    id: 'backward-avalanche',
    title: 'Backward Avalanche',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'c6 f5 h5 h1',
    p2: 'c8 Kc4 c2 e2',
    theme: 'Sacrifice',
    hint: "Offer a man on d7. Black's forced double jump lands right next to your h5 man, and men may capture backward.",
    lesson: 'c6–d7! forces c8×e6×g4. Then h5×f3×d1×b3×d5 captures all four black pieces, starting with two backward jumps.',
  },
  {
    id: 'smothered',
    title: 'Smothered Army',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'b3 e2 d1',
    p2: 'd5 a4 a2 c2 Kb1',
    theme: 'Blockade',
    hint: "Black's army is jammed into a corner. Give away one man so the capturing piece plugs the last gap.",
    lesson:
      'b3–c4! forces d5×b3. After a quiet e2–f3, every black piece is frozen. No legal moves means Black loses despite having five pieces.',
  },
  {
    id: 'hidden-path',
    title: 'Hidden Path',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'g6 b3 e2',
    p2: 'Kd7 b5 h5 e4',
    theme: 'Quiet move',
    hint: "Step next to b5 on the edge, where it cannot capture you. Black's forced reply adds one more piece to your capture route.",
    lesson:
      'b3–a4! Black must play h5×f7. Then a4×c6×e8 crowns mid-capture and the new Dama finishes ×g6×d3, taking all four pieces.',
  },
  {
    id: 'greedy-trap',
    title: 'The Greedy Trap',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'f3 b1',
    p2: 'c6 e6 a4 Ke4 c2 e2',
    theme: 'Capture choice',
    hint: "The four-piece capture is a trap. Capture only two, and let Black's forced reply line everything up for your other man.",
    lesson:
      'f3×d1×b3! forces a4×c2, and then b1×d3×f5×d7×b5 clears the board. Grabbing four pieces first would let Black hit back.',
  },
  {
    id: 'quiet-dama',
    title: 'The Quiet Dama',
    difficulty: 'Medium',
    goal: { type: 'win', moves: 2 },
    p1: 'd7 Kb3 b1',
    p2: 'c8 g4 Kd3 g2',
    theme: 'Quiet move',
    hint: 'Your d7 man is bait for c8. Switch your Dama to the other end of its long diagonal, so that after the capture it jumps toward the black Dama instead of away from it.',
    lesson: 'Kb3–g8! Black must take c8×e6, and the Dama answers g8×c4×f1×h3×f5, capturing all four black pieces.',
  },

  /* ------------------------------ HARD ------------------------------ */
  {
    id: 'double-sacrifice',
    title: 'Double Sacrifice',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'e6 b3 g2',
    p2: 'g8 c6 Kg4 a2',
    theme: 'Sacrifice',
    hint: "Give away two men to drag Black's pieces onto a single zig-zag line.",
    lesson: 'e6–f7! g8×e6, g2–h3! a2×c4, and the h3 man finishes with h3×f5×d7×b5×d3.',
  },
  {
    id: 'seven-maze',
    title: 'Seven-Piece Maze',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 7 },
    p1: 'e6 Kg6 a2 g2',
    p2: 'c8 d7 Kf7 d5 f5 g4 b3 e2',
    theme: 'Flying king',
    hint: 'Start with the jump over f5. The winning route touches all four edges of the board, and only c8 survives.',
    lesson: 'Kg6×e4×c6×e8×h5×f3×d1×a4: a tour of all four edges that captures seven pieces, leaving only c8.',
  },
  {
    id: 'dama-retreat',
    title: 'Dama Retreat',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'Kc6 b3 h1',
    p2: 'f7 f5 Kd3 a2',
    theme: 'Quiet move',
    hint: "Pull your Dama back to the top edge, on f7's diagonal. Black's forced capture does not stop the sweep that follows.",
    lesson: 'Kc6–e8! After the forced a2×c4, e8×g6×e4×c2 takes three pieces, and the last black man falls on the next move.',
  },
  {
    id: 'decoy-f3',
    title: 'Decoy on f3',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'g2 b1 Kf1',
    p2: 'a8 Kd7 e4 g4',
    theme: 'Decoy',
    hint: 'Offer a man so that the capturing black piece lands right next to your Dama.',
    lesson: 'g2–f3! e4×g2 is forced, then Kf1×h3×f5×c8 takes three. The last man cannot escape the Dama.',
  },
  {
    id: 'full-circle',
    title: 'Full Circle',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'f7 g6 h1',
    p2: 'a6 b5 h5 Kg4 b3',
    theme: 'Crowning',
    hint: "Crown at once. Black's forced capture drops a man on f7, and your new Dama can loop around the board and come back for it.",
    lesson:
      'f7–e8 crowns, h5×f7 is forced, and the Dama loops e8×a4×d1×h5×e8, back to where it was crowned. The last man falls next move.',
  },
  {
    id: 'eight-sweep',
    title: 'Eight-Piece Sweep',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 8 },
    p1: 'Kd7 h5',
    p2: 'b7 c6 e6 g6 c4 Ke4 b3 a2 e2',
    theme: 'Flying king',
    hint: 'Start with the jump over c6. Every landing must line up the next jump, and in the end only one black man survives.',
    lesson: 'Kd7×a4×d1×g4×c8×a6×d3×f5×h7 captures eight pieces. Only the man on a2 survives.',
  },
  {
    id: 'twin-offers',
    title: 'Twin Offers',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'b7 Kd1 f1',
    p2: 'Ka8 f7 e4',
    theme: 'Sacrifice',
    hint: "Give Black two men, one after the other. Each forced capture pulls a black piece onto your Dama's route.",
    lesson: 'f1–e2 lets Black take a8×c6, then e2–d3! forces e4×c2, and Kd1×a4×e8×g6 captures all three pieces.',
  },
  {
    id: 'sweep-smother',
    title: 'Sweep and Smother',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'd5 Kh5 b1',
    p2: 'b7 f7 g6 Kb5 b3',
    theme: 'Sacrifice',
    hint: "Offer your d5 man. Black's forced capture opens a path for your Dama right through the black camp.",
    lesson:
      'd5–e6! forces f7×d5, then Kh5×f7×c4×a6×c8 takes four. The last man on b3 is doomed: it either walks into your b1 man or gets stuck on a2 with no legal move.',
  },
  {
    id: 'grand-combo',
    title: 'Grand Combination',
    difficulty: 'Hard',
    goal: { type: 'win', moves: 3 },
    p1: 'b7 e4 g4',
    p2: 'h5 b3 Kh3',
    theme: 'Combination',
    hint: "Sacrifice first to drag the h5 man away, then crown a Dama and let Black's Dama take the bait.",
    lesson: "e4–f5! h5×f3, b7–c8 crowns, and once Black's Dama captures on f5, c8×g4×d1×a4 clears the board.",
  },
  {
    id: 'nine-sweep',
    title: 'Nine-Piece Sweep',
    difficulty: 'Hard',
    goal: { type: 'capture', count: 9 },
    p1: 'Kc8',
    p2: 'b7 d7 g6 Kc4 e4 g4 b3 e2 g2',
    theme: 'Flying king',
    hint: 'Begin by jumping b7. Every landing square must keep the chain alive as the Dama circles the board.',
    lesson: 'c8×a6×d3×f1×h3×f5×c2×a4×e8×h5. Nine pieces in a single turn!',
  },
];

export const levelsOf = (d: Difficulty) => PUZZLES.filter((p) => p.difficulty === d);

export function goalText(goal: PuzzleGoal): string {
  if (goal.type === 'capture') return `Capture ${goal.count} pieces in a single turn.`;
  if (goal.moves === 1) return 'White to move and win in 1: leave Black with no pieces or no legal moves.';
  return `White to move and win in ${goal.moves} moves against any defense.`;
}

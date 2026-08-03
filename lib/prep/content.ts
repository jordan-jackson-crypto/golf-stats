/**
 * Play Prep — the "how to actually score" reference. Grounded in:
 *  - Jon Sherman, "The Four Foundations of Golf"
 *  - Scott Fawcett, DECADE course management
 *  - Mark Broadie, "Every Shot Counts" (strokes gained)
 *
 * Content only — rendered by app/(tabs)/prep/page.tsx as expandable cards.
 */

export interface PrepCard {
  id: string;
  title: string;
  summary: string; // one-line hook (always visible)
  points: string[]; // expanded detail
  source?: string;
}

export interface PrepSection {
  id: string;
  title: string;
  subtitle: string;
  cards: PrepCard[];
}

export const PREP: PrepSection[] = [
  {
    id: "mastery",
    title: "Mastery",
    subtitle: "The mental models that separate scoring from ball-striking.",
    cards: [
      {
        id: "avoid-big-numbers",
        title: "Scoring is avoiding big numbers, not making birdies",
        summary: "The gap between your good and bad rounds is doubles, not birdies.",
        source: "Broadie / Sherman",
        points: [
          "Compare two of your rounds five shots apart — the birdie count is usually nearly identical. The difference is doubles and others.",
          "A double bogey is almost never a swing failure. It's a decision failure: a hero shot from trouble, a short-side miss, or an aggressive line into the wrong miss.",
          "Play the whole round to make bogey your worst realistic outcome. Birdies are a byproduct of eliminating disasters, not a target you chase.",
        ],
      },
      {
        id: "play-your-dispersion",
        title: "Play to your dispersion, not the pin",
        summary: "You don't hit shots, you hit shot patterns. Aim the pattern, not the ball.",
        source: "Fawcett / DECADE",
        points: [
          "Every shot has a cone of outcomes — even tour pros miss their line by ~5-7% of the distance. From 150y that's a ~20-30 ft wide pattern.",
          "Pick the aim point where your ENTIRE cone is safe. If firing at a tucked pin puts the left edge of your pattern in a bunker or short-sided, aim at the center of the green instead.",
          "This is why great iron players look 'boring' — they're hitting the fat of the green and two-putting, not stiffing it.",
        ],
      },
      {
        id: "realistic-expectations",
        title: "Calibrate your expectations to reality",
        summary: "Frustration comes from expecting tour proximity. Even scratch misses a lot.",
        source: "Sherman (Foundation 1)",
        points: [
          "A scratch player from 150-175y averages ~30-35 ft and hits the green ~55-60% of the time. From 175-200y, GIR drops toward 45%.",
          "Around 8-10 ft, even tour pros make barely 40%. Missing a 10-footer is the expected outcome, not a failure.",
          "Judging each shot against a fantasy standard leads to bad decisions (pressing, aiming at pins). Judge it against your realistic baseline — that's what the Stats tab benchmarks are for.",
        ],
      },
      {
        id: "four-foundations",
        title: "The Four Foundations",
        summary: "Manage expectations, strategy, practice, and the mental game — in that order.",
        source: "Jon Sherman",
        points: [
          "1. Expectations — know what realistic performance looks like so you make sane decisions.",
          "2. Strategy — the cheapest strokes for a good ball-striker live here (course management).",
          "3. Practice — deliberate, scored, transfer-focused (the Practice tab games).",
          "4. Mental game — a repeatable routine so range-freedom shows up under pressure.",
          "Your stated gap — striking it well but not scoring — is almost pure Foundation 2.",
        ],
      },
    ],
  },
  {
    id: "best-practices",
    title: "Best Practices",
    subtitle: "The repeatable decisions to run on every shot.",
    cards: [
      {
        id: "pre-shot-routine",
        title: "The pre-shot decision routine",
        summary: "Run the same 4 steps on every full shot. Decide behind the ball, commit over it.",
        points: [
          "1. Trouble check — where is the big number? (OB, water, short-side). That defines your no-go zone.",
          "2. Pick target + shape — the aim point that keeps your whole dispersion cone out of the no-go zone.",
          "3. Commit to club & shot — no rethinking once you're over it.",
          "4. Go — same tempo and look you use on the range.",
          "The decision happens BEHIND the ball. Over the ball is execution only.",
        ],
      },
      {
        id: "off-the-tee",
        title: "Off the tee: kill the two-way miss",
        summary: "Know your ball can't go one direction, then aim away from trouble.",
        source: "Fawcett",
        points: [
          "The score-killer isn't the average miss — it's the big one that brings penalty or recovery into play. That's why the Driver Game weights the double-cross at -3.",
          "If you know you'll never miss right, you can aim down the right edge and use the whole hole with a free swing.",
          "Take driver more often than feels comfortable on non-trouble holes — distance gained is real strokes, and the fear of the miss is usually overweighted.",
        ],
      },
      {
        id: "approach",
        title: "Approach: center of green, protect the short-side",
        summary: "Fire at pins only when your pattern is safe. Otherwise, middle.",
        points: [
          "Short-siding yourself turns a routine par into a bogey-or-worse scramble. The short-side miss is the one to eliminate.",
          "From 175y+, aim center-of-green almost always. The green is big; your pattern is big; math says take the two-putt.",
          "Only attack a pin when: you're inside wedge range, the pin isn't tucked, and your miss is to the fat side.",
        ],
      },
      {
        id: "short-game-putting",
        title: "Around the green & putting: get the ball working early",
        summary: "Least loft that carries the fringe; lag to 2 ft past on the high side.",
        points: [
          "Chipping: use the least-lofted club that lands the ball on the green and rolls out. On the ground is higher-percentage than in the air.",
          "Never short-side a chip — take your medicine to the fat side of the green.",
          "Putting: speed before line. A lag that finishes ~2 ft past on the high side keeps the ball in the capture zone the whole way and leaves an uphill tap-in. Short putts have zero chance; low-side leaves fall away.",
        ],
      },
      {
        id: "know-your-numbers",
        title: "Know your carry numbers",
        summary: "Especially wedges. Guessing distances is a silent stroke-leak.",
        points: [
          "Carry (not total) distance for every wedge and short iron. Get these on a launch monitor or by charting the Wedge Game.",
          "50-150y is your densest scoring range — precise distances here convert directly to birdie looks.",
          "Factor in that you play from your realistic carry, not your best-ever number.",
        ],
      },
    ],
  },
  {
    id: "stats-approach",
    title: "Stats Approach to Scoring",
    subtitle: "Use your own data to decide what to fix and how to play.",
    cards: [
      {
        id: "find-the-leak",
        title: "Let SG-by-distance pick your practice",
        summary: "The Stats tab shows the exact distances bleeding strokes. Work those.",
        points: [
          "Open Stats → SG by approach distance. The band that's most negative vs your target is your #1 practice priority.",
          "Don't practice what you're already good at because it's fun — flow reps to the biggest leak.",
          "Re-check every ~10 rounds; the leak moves as you improve.",
        ],
      },
      {
        id: "tiger-5-doubles",
        title: "Attack your Tiger 5",
        summary: "Your doubles have a pattern. Find it, and half of them disappear.",
        points: [
          "The Tiger 5 tracks the five costly mistakes. Whichever you're furthest over target on is costing you the most avoidable strokes.",
          "Most doubles trace to one or two root causes — a specific trouble miss, or aggressive wedge play leaving short-side misses.",
          "Eliminating one double per round is often 2-3 strokes off your handicap with zero swing change.",
        ],
      },
      {
        id: "gained-vs-benchmarks",
        title: "Benchmark against the right standard",
        summary: "Compare vs scratch/tour to see where you truly stand — and where the ceiling is.",
        points: [
          "Use the compare-vs selector on Stats. 'Vs scratch' tells you if you're already at your goal level in a category.",
          "A category at scratch level with a weak neighbor means: stop grinding the strength, fix the weakness.",
          "Gaining 0.5 SG/round in your worst category is far cheaper than another 0.2 in your best.",
        ],
      },
      {
        id: "pre-round-brief",
        title: "Build a pre-round plan",
        summary: "Before you tee off, decide your strategy for the day from your data.",
        points: [
          "Know your typical miss and where it can't go on this course. Aim accordingly all day.",
          "Set a realistic scoring target from your recent average — not your best round. Playing to your baseline reduces pressing.",
          "Pick 1-2 process goals (e.g. 'center of green from 175+', 'never short-side a chip') instead of a score goal.",
        ],
      },
    ],
  },
];

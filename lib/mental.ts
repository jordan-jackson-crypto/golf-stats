/**
 * Mental mistakes — taxonomy + aggregation.
 *
 * Shot-level SG tells you WHERE strokes leak. This tells you WHY. A 1-handicap
 * rarely loses to a swing flaw on a given day; they lose to a decision, a
 * commitment failure, or an emotional carry-over. Tagging the mistake in the
 * moment (while you still remember it) is the only way to see the pattern.
 *
 * Every tag carries three layers, mirroring how insights read elsewhere in
 * the app: what it is → what it costs you → what to do instead.
 */

import type { StoredRound, MentalMistakeDetail, MentalPhase } from "@/lib/storage/types";

export type MentalMistakeTag =
  | "decision"
  | "commitment"
  | "ego"
  | "carelessness"
  | "emotion"
  | "focus"
  | "routine"
  | "tentative"
  | "impatience"
  | "scoreboard";

export interface MentalMistakeMeta {
  tag: MentalMistakeTag;
  label: string;
  /** What it is — the one-line definition you check yourself against. */
  what: string;
  /** What it costs — why this shows up in the score. */
  cost: string;
  /** The fix — a cue you can actually run on the next tee. */
  cue: string;
}

export const MENTAL_MISTAKES: MentalMistakeMeta[] = [
  {
    tag: "decision",
    label: "Bad decision",
    what: "Wrong club, wrong target, or wrong risk for the situation — the strategy was flawed before the swing started.",
    cost: "Turns a neutral shot into a short-sided or penalty leave. Usually 0.5–1.5 strokes on the spot.",
    cue: "Pick the target that makes your MISS acceptable, not the one that makes your best shot great.",
  },
  {
    tag: "commitment",
    label: "Not committed",
    what: "Two thoughts over the ball — switched clubs late, second-guessed the line, or swung while still deciding.",
    cue: "If doubt shows up, step off. Restart the routine. Never hit an undecided shot.",
    cost: "Indecision shows up as tempo and face control — the most common source of a 'random' bad swing.",
  },
  {
    tag: "ego",
    label: "Ego / hero shot",
    what: "Took on a shot you'd pull off less than half the time — driver on a hole that doesn't need it, going at a tucked pin, or forcing it out of trouble.",
    cost: "Hero shots pay +1 when they work and −2 when they don't. The math is against you.",
    cue: "Ask: 'would I take this shot if I were 1-up in a match?' If no, take the 80% option.",
  },
  {
    tag: "carelessness",
    label: "Careless / rushed prep",
    what: "Didn't check wind, lie, elevation, or number — skipped a step you normally do.",
    cost: "Free strokes given away on shots your game was fully capable of hitting.",
    cue: "Number, wind, lie, target — say all four out loud before you pull a club.",
  },
  {
    tag: "emotion",
    label: "Anger / frustration",
    what: "Carried the last hole (or the last shot) into this one.",
    cost: "The 'double after a double' pattern. Emotional carry-over is the single biggest driver of big numbers.",
    cue: "10 steps of walking = the hole is over. Reset ritual before you get to the next tee.",
  },
  {
    tag: "focus",
    label: "Lost focus",
    what: "Mind elsewhere — conversation, phone, score, work — and you played a shot on autopilot.",
    cost: "Autopilot shots come from a swing that never got a target.",
    cue: "Switch on at the bag, off after the shot. You only need 40 focused seconds per shot.",
  },
  {
    tag: "routine",
    label: "Broke routine",
    what: "Skipped or shortened the pre-shot routine, or rushed because of pace of play or the group.",
    cost: "Routine is the delivery mechanism for everything else. No routine = no repeatability.",
    cue: "Same routine, same count, every shot — including the tap-in and the punch-out.",
  },
  {
    tag: "tentative",
    label: "Tentative / steering",
    what: "Played defensively — decelerated, steered, or protected against a miss instead of committing to the shot.",
    cost: "Steered shots leak right/short and turn pars into bogeys, especially with wedges.",
    cue: "Commit to the finish, not the strike. Pick a smaller target and swing through it.",
  },
  {
    tag: "impatience",
    label: "Impatience / forcing it",
    what: "Tried to get strokes back immediately after dropping one, instead of letting the round come to you.",
    cost: "Compounds one mistake into a stretch of three or four holes.",
    cue: "Par is a great score after a bogey. Take your medicine, take the next fairway.",
  },
  {
    tag: "scoreboard",
    label: "Scoreboard / outcome",
    what: "Started playing the number — protecting a score, chasing a target, or doing the math mid-round.",
    cost: "Shifts attention from the shot to the consequence; produces both tentative shots and hero shots.",
    cue: "Play the shot in front of you. Add it up on the 18th green.",
  },
];

export const MENTAL_BY_TAG: Record<MentalMistakeTag, MentalMistakeMeta> = Object.fromEntries(
  MENTAL_MISTAKES.map((m) => [m.tag, m]),
) as Record<MentalMistakeTag, MentalMistakeMeta>;

export const PHASE_LABEL: Record<MentalPhase, string> = {
  tee: "Tee shot",
  approach: "Approach",
  "short-game": "Short game",
  putt: "Putting",
  between: "Between shots",
};

/** One flagged mental mistake, resolved against the round it came from. */
export interface MentalMistakeEntry {
  roundId: string;
  date: string;
  courseName: string;
  hole: number;
  par: number;
  score?: number;
  /** score − par on the hole, when a score was entered. */
  toPar?: number;
  /** What was tagged on the hole. */
  detail: MentalMistakeDetail;
}

export interface MentalTagStat {
  tag: MentalMistakeTag;
  meta: MentalMistakeMeta;
  count: number;
  /** Share of flagged holes carrying this tag (a hole can carry several). */
  share: number;
  /** Average strokes over par on the holes carrying this tag. */
  avgToPar: number | null;
  /** Total strokes over par given away on those holes. */
  strokesOverPar: number;
  /** Most recent occurrence, YYYY-MM-DD. */
  lastSeen?: string;
}

export interface MentalLibrary {
  entries: MentalMistakeEntry[]; // newest first
  tagStats: MentalTagStat[]; // biggest cost first
  phaseCounts: { phase: MentalPhase; count: number }[];
  /** Holes flagged as a mental mistake. */
  totalFlagged: number;
  /** Of those, how many carry at least one tag. */
  totalTagged: number;
  /** Mental mistakes per round across the rounds supplied. */
  perRound: number;
  /** Total strokes over par on flagged holes — the headline cost. */
  strokesOverPar: number;
  /** Average strokes over par on NON-flagged holes, for comparison. */
  baselineToPar: number | null;
}

/**
 * Roll every flagged mental mistake across the supplied rounds into a library.
 * Rounds should already be filtered to `status === "complete"` by the caller.
 */
export function buildMentalLibrary(rounds: StoredRound[]): MentalLibrary {
  const entries: MentalMistakeEntry[] = [];
  let flaggedStrokesOverPar = 0;
  let cleanHoles = 0;
  let cleanToParSum = 0;

  for (const r of rounds) {
    const holeCount = r.holeCount ?? 18;
    const pars = r.parPerHole ?? [];
    const scores = r.holeScores ?? [];
    const errs = r.unforcedErrorsByHole ?? [];

    for (let i = 0; i < holeCount; i++) {
      const par = pars[i] ?? 4;
      const score = scores[i] || undefined;
      const e = errs[i];
      const flagged = !!e?.mentalMistake;

      if (!flagged) {
        if (score) {
          cleanHoles++;
          cleanToParSum += score - par;
        }
        continue;
      }

      const toPar = score ? score - par : undefined;
      if (toPar != null && toPar > 0) flaggedStrokesOverPar += toPar;

      entries.push({
        roundId: r.id,
        date: r.date,
        courseName: r.courseName,
        hole: i + 1,
        par,
        score,
        toPar,
        detail: e?.mental ?? { tags: [] },
      });
    }
  }

  entries.sort((a, b) => (a.date === b.date ? b.hole - a.hole : b.date.localeCompare(a.date)));

  // Tag rollup
  const byTag = new Map<MentalMistakeTag, { count: number; overPar: number; toParSum: number; toParN: number; lastSeen: string }>();
  const byPhase = new Map<MentalPhase, number>();
  let totalTagged = 0;

  for (const entry of entries) {
    const tags = entry.detail.tags ?? [];
    if (tags.length > 0) totalTagged++;
    if (entry.detail.phase) {
      byPhase.set(entry.detail.phase, (byPhase.get(entry.detail.phase) ?? 0) + 1);
    }
    for (const tag of tags) {
      const cur = byTag.get(tag) ?? { count: 0, overPar: 0, toParSum: 0, toParN: 0, lastSeen: entry.date };
      cur.count++;
      if (entry.toPar != null) {
        cur.toParSum += entry.toPar;
        cur.toParN++;
        if (entry.toPar > 0) cur.overPar += entry.toPar;
      }
      if (entry.date > cur.lastSeen) cur.lastSeen = entry.date;
      byTag.set(tag, cur);
    }
  }

  const tagStats: MentalTagStat[] = [...byTag.entries()]
    .map(([tag, v]) => ({
      tag,
      meta: MENTAL_BY_TAG[tag],
      count: v.count,
      share: entries.length ? v.count / entries.length : 0,
      avgToPar: v.toParN ? v.toParSum / v.toParN : null,
      strokesOverPar: v.overPar,
      lastSeen: v.lastSeen,
    }))
    .filter((t) => !!t.meta)
    .sort((a, b) => b.strokesOverPar - a.strokesOverPar || b.count - a.count);

  const phaseCounts = [...byPhase.entries()]
    .map(([phase, count]) => ({ phase, count }))
    .sort((a, b) => b.count - a.count);

  return {
    entries,
    tagStats,
    phaseCounts,
    totalFlagged: entries.length,
    totalTagged,
    perRound: rounds.length ? entries.length / rounds.length : 0,
    strokesOverPar: flaggedStrokesOverPar,
    baselineToPar: cleanHoles ? cleanToParSum / cleanHoles : null,
  };
}

/**
 * Points-game library. Games are scored to reward the outcomes that actually
 * gain strokes (proximity, fairways, up-and-downs) and punish the ones that
 * bleed them (short putts, big misses, chunks). Numbers are starting points —
 * tune targets as you gather your own baselines.
 */

import type { GameDef } from "./types";

export const GAMES: GameDef[] = [
  // ============ PUTTING ============
  {
    id: "putting-clock-3-6-9",
    area: "putting",
    name: "Clock Drill (3-6-9)",
    tagline: "Make putts around the clock at 3, 6, and 9 feet.",
    description:
      "Four positions around the hole at each of 3, 6, and 9 ft (12 balls per ring). Putt around each ring, track makes.",
    howToScore: "1 point per make. 36 balls total.",
    whyItMatters:
      "Make % from 3-9 ft is where putting SG is won or lost. Inside 10 ft, every % point of make rate is real strokes.",
    maxPoints: 36,
    targetPoints: 28,
    higherIsBetter: true,
    stations: [
      { key: "3ft", label: "3 ft ring", maxPer: 12 },
      { key: "6ft", label: "6 ft ring", maxPer: 12 },
      { key: "9ft", label: "9 ft ring", maxPer: 12 },
    ],
  },
  {
    id: "putting-high-side-lag",
    area: "putting",
    name: "High-Side Lag",
    tagline: "Lag to 2 feet past, high side only. Never short.",
    description:
      "12 lag putts from 20-50 ft. The goal on every putt is to finish ~2 ft past the hole on the HIGH side — that leaves the easiest, straightest comebacker. Short putts and low-side leaves are the miss.",
    howToScore:
      "Made +2 · finishes ~2 ft past on the high side +2 · past within 3 ft +1 · short −1 · blown 3 ft+ by −1.",
    whyItMatters:
      "Speed is 80% of lag putting. 'Two feet past, high side' is the pro standard: it keeps the ball in the hole's capture zone the whole way and leaves an uphill tap-in. Short = zero chance; low side = the ball falls away.",
    shotsPerRound: 12,
    maxPoints: 24,
    targetPoints: 13,
    higherIsBetter: true,
    outcomes: [
      { key: "made", label: "Made", points: 2 },
      { key: "past_high", label: "~2 ft past, high side", points: 2 },
      { key: "past_ok", label: "Past, within 3 ft", points: 1 },
      { key: "short", label: "Short", points: -1, hint: "cardinal sin" },
      { key: "blown", label: "Blown by 3 ft+", points: -1 },
    ],
  },
  {
    id: "putting-9hole-par",
    area: "putting",
    name: "9-Hole Putting Par",
    tagline: "Par-2 from 9 varied distances. Beat level par.",
    description:
      "Play 9 'holes' from varied distances (4-40 ft). Par is 2 each. Count total putts vs par 18.",
    howToScore: "Record total putts. Lower is better. Par = 18.",
    whyItMatters: "Simulates the mix of putts a real round throws at you, under a scoring format.",
    maxPoints: 18,
    targetPoints: 17,
    higherIsBetter: false,
  },

  // ============ SHORT GAME ============
  {
    id: "sg-up-and-down-par18",
    area: "short-game",
    name: "Up & Down Par-18",
    tagline: "9 shots around the green. Get up and down.",
    description:
      "Drop 9 balls in varied lies/distances around a green. Play each out and putt until holed. Par is 2 (up & down) per hole.",
    howToScore: "Record total strokes. Par = 18. Lower is better.",
    whyItMatters: "Scrambling saves rounds. Up-and-down % is a top predictor of turning bad ball-striking days into decent scores.",
    maxPoints: 27,
    targetPoints: 20,
    higherIsBetter: false,
  },
  {
    id: "sg-around-green-points",
    area: "short-game",
    name: "Short Game SG Points",
    tagline: "10 chips/pitches scored on proximity. Get it close, gain points.",
    description:
      "10 shots from varied lies inside 30 yards. Score each by how close it finishes — the same way strokes gained rewards proximity.",
    howToScore:
      "Inside 3 ft +2 · inside 8 ft +1 · inside 15 ft 0 · outside 15 ft −1 · off the green / chunk −2.",
    whyItMatters:
      "Around the green, SG is almost entirely proximity. A pro averages ~6-8 ft from 20 yards; leaving it inside a putter's make zone is the whole game.",
    shotsPerRound: 10,
    maxPoints: 20,
    targetPoints: 8,
    higherIsBetter: true,
    outcomes: [
      { key: "in3", label: "Inside 3 ft", points: 2 },
      { key: "in8", label: "Inside 8 ft", points: 1 },
      { key: "in15", label: "Inside 15 ft", points: 0 },
      { key: "out15", label: "Outside 15 ft", points: -1 },
      { key: "miss", label: "Off green / chunk", points: -2 },
    ],
  },

  // ============ BALL STRIKING ============
  {
    id: "bs-driver-game",
    area: "ball-striking",
    name: "Driver Game",
    tagline: "18 drives. Fairway +1, miss −1, big miss −3. Get to +15.",
    description:
      "Pick a target line and a fairway-width corridor (~30 yds). Hit 18 drives. Score each: in the corridor +1, a normal miss −1, a big miss or double-cross −3.",
    howToScore: "Fairway +1 · miss −1 · big miss / double-cross −3. Goal: +15.",
    whyItMatters:
      "Off the tee, the killer isn't the average miss — it's the big one that brings penalty/recovery into play. Weighting the double-cross at −3 trains you to eliminate the two-way miss, which is what actually protects scores.",
    shotsPerRound: 18,
    maxPoints: 18,
    targetPoints: 15,
    higherIsBetter: true,
    outcomes: [
      { key: "fairway", label: "Fairway", points: 1 },
      { key: "miss", label: "Miss", points: -1 },
      { key: "big_miss", label: "Big miss / double-cross", points: -3 },
    ],
  },
  {
    id: "bs-9-shot",
    area: "ball-striking",
    name: "9-Shot Game",
    tagline: "Low/mid/high × draw/straight/fade, 8i through 4i.",
    source: "Trackman / tour range staple",
    description:
      "Work through the mid/long irons (8i-4i). For a chosen club, hit all 9 windows: low/mid/high × draw/straight/fade. Award a point for each shot that clearly matches the intended window.",
    howToScore: "1 point per successful shot shape. 9 shots, max 9.",
    whyItMatters:
      "Shot-shape control is clubface and low-point mastery. Owning all 9 windows means you can flight it down in wind and shape it to any pin — the foundation of controlling approach dispersion.",
    maxPoints: 9,
    targetPoints: 6,
    higherIsBetter: true,
    stations: [{ key: "shapes", label: "Successful shapes", maxPer: 9 }],
  },
  {
    id: "bs-wedge-50-150",
    area: "ball-striking",
    name: "Wedge Game (50-150y)",
    tagline: "12 wedges scored on proximity. Your scoring clubs.",
    description:
      "12 shots from varied distances 50-150 yards. Score each on proximity, SG-style. This is your birdie-chance range — dial it in.",
    howToScore:
      "Inside 10 ft +3 · inside 20 ft +2 · inside 30 ft +1 · on green outside 30 ft 0 · miss green −2.",
    whyItMatters:
      "From 50-150y a tour pro averages ~18-24 ft. This is the single densest scoring range in golf — proximity here converts directly to birdie looks and SG-approach.",
    shotsPerRound: 12,
    maxPoints: 36,
    targetPoints: 18,
    higherIsBetter: true,
    outcomes: [
      { key: "in10", label: "Inside 10 ft", points: 3 },
      { key: "in20", label: "Inside 20 ft", points: 2 },
      { key: "in30", label: "Inside 30 ft", points: 1 },
      { key: "on", label: "On green, 30 ft+", points: 0 },
      { key: "miss", label: "Missed green", points: -2 },
    ],
  },
  {
    id: "bs-approach-150-plus",
    area: "ball-striking",
    name: "Approach Game (150y+) · Par 72",
    tagline: "18 approaches from 150+. Proximity scored to 72.",
    description:
      "18 approach shots, all from 150 yards or more, to a target green. Score each on proximity. A perfect round is 72.",
    howToScore:
      "Inside 20 ft +4 · inside 30 ft +3 · inside 40 ft +2 · on green +1 · miss green 0. Max 72.",
    whyItMatters:
      "Long approaches are about hitting greens and avoiding the short-side miss, not stiffing it. Rewarding 'on green' generously (and never punishing) mirrors how SG-approach from 150+ rewards greens in regulation.",
    shotsPerRound: 18,
    maxPoints: 72,
    targetPoints: 40,
    higherIsBetter: true,
    outcomes: [
      { key: "in20", label: "Inside 20 ft", points: 4 },
      { key: "in30", label: "Inside 30 ft", points: 3 },
      { key: "in40", label: "Inside 40 ft", points: 2 },
      { key: "on", label: "On green", points: 1 },
      { key: "miss", label: "Missed green", points: 0 },
    ],
  },
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function gamesByArea(area: string): GameDef[] {
  return GAMES.filter((g) => g.area === area);
}

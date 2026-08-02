/**
 * Points-game library. Drills and games can be sourced from anywhere
 * (tour players, coaches, publications). These are well-known competitive
 * practice games with clear scoring.
 *
 * To add a game, append a GameDef here. No other code changes needed.
 */

import type { GameDef } from "./types";

export const GAMES: GameDef[] = [
  // ---------------- PUTTING ----------------
  {
    id: "putting-clock-3-6-9",
    area: "putting",
    name: "Clock Drill (3-6-9)",
    tagline: "Make putts around the clock at 3, 6, and 9 feet.",
    description:
      "Place balls at four positions around the hole at each of 3 ft, 6 ft, and 9 ft (12 balls total per ring, 3 rings). Putt around each ring. Track makes.",
    howToScore: "1 point per make. 36 balls total.",
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
    id: "putting-lag-ladder",
    area: "putting",
    name: "Lag Ladder",
    tagline: "Speed control from 20, 30, 40, 50 feet.",
    description:
      "Hit 3 putts from each of 20, 30, 40, 50 ft. Score based on finishing inside a 3-ft circle around the hole (or holed).",
    howToScore: "2 pts holed, 1 pt inside 3 ft, 0 otherwise. 12 putts, max 24.",
    maxPoints: 24,
    targetPoints: 14,
    higherIsBetter: true,
    stations: [
      { key: "20ft", label: "20 ft", maxPer: 6 },
      { key: "30ft", label: "30 ft", maxPer: 6 },
      { key: "40ft", label: "40 ft", maxPer: 6 },
      { key: "50ft", label: "50 ft", maxPer: 6 },
    ],
  },
  {
    id: "putting-9hole-par",
    area: "putting",
    name: "9-Hole Putting Par",
    tagline: "Par-2 from 9 different distances. Beat level par.",
    description:
      "Play 9 'holes' from varied distances (mix of 4-40 ft). Par is 2 for each. Count total putts; compare to par 18.",
    howToScore: "Record total putts. Lower is better. Par = 18.",
    maxPoints: 18,
    targetPoints: 17,
    higherIsBetter: false,
  },

  // ---------------- SHORT GAME ----------------
  {
    id: "sg-up-and-down-par18",
    area: "short-game",
    name: "Up & Down Par-18",
    tagline: "9 chips from around the green. Get up and down.",
    description:
      "Drop 9 balls in varied lies/distances around a green. Play each out and putt until holed. Par is 2 (up & down) per hole.",
    howToScore: "Record total strokes. Par = 18. Lower is better.",
    maxPoints: 27,
    targetPoints: 20,
    higherIsBetter: false,
  },
  {
    id: "sg-10-ball-chip-ladder",
    area: "short-game",
    name: "10-Ball Chip Ladder",
    tagline: "Land 10 chips progressively farther, each inside a zone.",
    description:
      "Chip 10 balls to landing spots at increasing distances. Each ball that finishes inside a 6-ft circle earns points.",
    howToScore: "1 pt inside 6 ft, 2 pts inside 3 ft, 3 pts holed. 10 balls, max 30.",
    maxPoints: 30,
    targetPoints: 16,
    higherIsBetter: true,
  },

  // ---------------- BALL STRIKING ----------------
  {
    id: "bs-fawcett-driver-dispersion",
    area: "ball-striking",
    name: "Driver Dispersion Test",
    tagline: "10 drivers to a fairway-width target. Count keepers.",
    source: "Scott Fawcett / DECADE",
    description:
      "Pick a target line. Hit 10 drivers. A shot 'in play' finishes within a ~30-yard-wide corridor (fairway width). Track how many stay in play and note your miss bias.",
    howToScore: "1 point per ball in the corridor. 10 balls, max 10.",
    maxPoints: 10,
    targetPoints: 7,
    higherIsBetter: true,
  },
  {
    id: "bs-9-shot",
    area: "ball-striking",
    name: "9-Shot Game",
    tagline: "Low/mid/high × draw/straight/fade with one club.",
    source: "Trackman / tour range staple",
    description:
      "Hit all 9 shot shapes (3 trajectories × 3 curves) with a mid-iron. Award a point for each shot that clearly matches the intended window.",
    howToScore: "1 point per successful shot shape. 9 shots, max 9.",
    maxPoints: 9,
    targetPoints: 6,
    higherIsBetter: true,
  },
  {
    id: "bs-par18-approach",
    area: "ball-striking",
    name: "Par-18 Approach Game",
    tagline: "9 approaches from 100-175y. Proximity scored.",
    description:
      "Hit 9 approach shots from varied distances 100-175y to a target green. Score each on proximity to a pin.",
    howToScore: "3 pts inside 15 ft, 2 pts inside 30 ft, 1 pt on green. 9 shots, max 27.",
    maxPoints: 27,
    targetPoints: 15,
    higherIsBetter: true,
  },
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function gamesByArea(area: string): GameDef[] {
  return GAMES.filter((g) => g.area === area);
}

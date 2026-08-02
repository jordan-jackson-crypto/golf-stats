/**
 * Practice games — points-based drills you play and track over sessions.
 *
 * A GameDef is the static definition (rules, scoring, max points).
 * A GameSession is one recorded attempt with a final score.
 */

export type GameArea = "putting" | "short-game" | "ball-striking";

export interface GameDef {
  id: string;
  area: GameArea;
  name: string;
  tagline: string; // one-line hook
  source?: string; // e.g. "Scott Fawcett", "DECADE" — drills/games can be from anywhere
  description: string;
  howToScore: string;
  /** Max achievable points (for progress bars / % scoring). */
  maxPoints: number;
  /** A "good" target score for a scratch-level player. */
  targetPoints: number;
  /** Optional structured stations the user fills in (e.g. distances). */
  stations?: GameStation[];
  /** Higher score is better (default). Set false for games where lower wins. */
  higherIsBetter?: boolean;
}

export interface GameStation {
  key: string;
  label: string; // e.g. "3 ft"
  maxPer: number; // max points at this station
}

export interface GameSession {
  id: string;
  gameId: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  score: number;
  maxPoints: number;
  /** Per-station breakdown if the game has stations. */
  stationScores?: Record<string, number>;
  notes?: string;
}

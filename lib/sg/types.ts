/**
 * Types shared across the SG engine.
 * Distances are in YARDS for every lie except `green`, which is in FEET.
 */

export type Lie = "tee" | "fairway" | "rough" | "sand" | "recovery" | "green";

export type SGCategory = "OTT" | "APP" | "ARG" | "PUTT";

export interface ShotInput {
  /** Lie at the start of the shot. */
  startLie: Lie;
  /** Distance to hole at start of shot. Yards for non-green lies, feet for green. */
  startDistance: number;
  /** Lie at end of shot. Use "green" for putts, "tee" only for holed-out conceptually. */
  endLie: Lie;
  /** Distance to hole at end of shot. 0 if holed. Yards/feet matches endLie. */
  endDistance: number;
  /** True if this shot resulted in the ball being holed. */
  holed?: boolean;
  /** True if a penalty stroke was incurred on this shot (e.g. OB, water, lost ball). */
  penalty?: boolean;
  /** Par of the hole (3, 4, or 5). Required for tee-shot baseline selection. */
  par: 3 | 4 | 5;
}

export interface ShotSG {
  sg: number;
  category: SGCategory;
}

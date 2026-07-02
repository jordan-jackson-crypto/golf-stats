/**
 * Storage facade.
 * All app code imports from here (not from ./local directly).
 * Writes go to IndexedDB immediately and fire a best-effort push to Supabase
 * in the background. Reads come from IndexedDB.
 */

"use client";

import * as local from "./local";
import { pushRound, pushShot, pushCourse, deleteRoundEverywhere, deleteShotRemote } from "./sync";
import type { StoredRound, StoredShot, StoredCourse, EntryMetrics } from "./types";

// ---------- reads (local only) ----------
export const getRound = local.getRound;
export const listRounds = local.listRounds;
export const getShotsForRound = local.getShotsForRound;
export const listCourses = local.listCourses;
export const getMetrics = local.getMetrics;

// ---------- writes (local + background cloud) ----------

export async function saveRound(round: StoredRound): Promise<void> {
  await local.saveRound(round);
  void pushRound(round);
}

export async function saveShot(roundId: string, shot: StoredShot): Promise<void> {
  await local.saveShot(roundId, shot);
  void pushShot(roundId, shot);
}

export async function upsertCourse(course: StoredCourse): Promise<void> {
  await local.upsertCourse(course);
  void pushCourse(course);
}

export async function saveMetrics(m: EntryMetrics): Promise<void> {
  // Metrics stay local-only (they're just dev instrumentation, not user data).
  await local.saveMetrics(m);
}

// ---------- deletes (local + background cloud) ----------

export async function deleteRound(id: string): Promise<void> {
  await deleteRoundEverywhere(id);
}

export async function deleteShot(id: string): Promise<void> {
  await local.deleteShot(id);
  void deleteShotRemote(id);
}

export async function deleteCourse(name: string): Promise<void> {
  await local.deleteCourse(name);
  // (No remote delete for courses yet — they're small and non-destructive to leave.)
}

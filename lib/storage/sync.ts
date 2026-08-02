/**
 * Cloud sync — mirrors local IndexedDB to Supabase.
 *
 * Model: IndexedDB is the primary write target (offline-first). Cloud pushes
 * are best-effort and fire in the background; they NEVER block or throw into
 * the UI. The user id is read from a synchronous cache (set by AuthProvider),
 * so a write does not trigger a network round-trip to the auth server.
 *
 * Conflict resolution: last-writer-wins by `updatedAt`.
 */

"use client";

import { supabase } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/session";
import {
  listRounds as idbListRounds,
  saveRound as idbSaveRound,
  deleteRound as idbDeleteRound,
  getShotsForRound as idbGetShotsForRound,
  saveShot as idbSaveShot,
  listCourses as idbListCourses,
  upsertCourse as idbUpsertCourse,
  deleteCourse as idbDeleteCourse,
  listGameSessions as idbListGameSessions,
  saveGameSession as idbSaveGameSession,
} from "./local";
import type { StoredRound, StoredShot, StoredCourse } from "./types";
import type { GameSession } from "@/lib/practice/types";

// ---------- Round sync (best-effort, non-throwing) ----------

export async function pushRound(round: StoredRound): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from("rounds").upsert({
      id: round.id,
      user_id: userId,
      data: round,
      updated_at: new Date(round.updatedAt).toISOString(),
    });
    if (error) console.warn("pushRound:", error.message);
  } catch (e) {
    console.warn("pushRound failed (offline?):", e);
  }
}

export async function pushShot(roundId: string, shot: StoredShot): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from("shots").upsert({
      id: shot.id,
      round_id: roundId,
      user_id: userId,
      data: shot,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("pushShot:", error.message);
  } catch (e) {
    console.warn("pushShot failed (offline?):", e);
  }
}

export async function pushCourse(course: StoredCourse): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from("courses").upsert({
      name: course.name,
      user_id: userId,
      data: course,
      updated_at: new Date(course.lastUsedAt).toISOString(),
    });
    if (error) console.warn("pushCourse:", error.message);
  } catch (e) {
    console.warn("pushCourse failed (offline?):", e);
  }
}

export async function deleteRoundRemote(roundId: string): Promise<void> {
  if (!getCurrentUserId()) return;
  try {
    await supabase.from("rounds").delete().eq("id", roundId);
    // shots cascade via FK
  } catch (e) {
    console.warn("deleteRoundRemote failed:", e);
  }
}

export async function deleteShotRemote(shotId: string): Promise<void> {
  if (!getCurrentUserId()) return;
  try {
    await supabase.from("shots").delete().eq("id", shotId);
  } catch (e) {
    console.warn("deleteShotRemote failed:", e);
  }
}

export async function pushGameSession(session: GameSession): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from("game_sessions").upsert({
      id: session.id,
      user_id: userId,
      data: session,
      updated_at: new Date(session.createdAt).toISOString(),
    });
    if (error) console.warn("pushGameSession:", error.message);
  } catch (e) {
    console.warn("pushGameSession failed (offline?):", e);
  }
}

// ---------- Full pull (on login) ----------

interface RemoteRoundRow { id: string; data: StoredRound; updated_at: string }
interface RemoteShotRow { id: string; round_id: string; data: StoredShot; updated_at: string }
interface RemoteCourseRow { name: string; data: StoredCourse; updated_at: string }

export async function pullAll(): Promise<{ rounds: number; shots: number; courses: number }> {
  const userId = getCurrentUserId();
  if (!userId) return { rounds: 0, shots: 0, courses: 0 };

  const [roundsRes, shotsRes, coursesRes] = await Promise.all([
    supabase.from("rounds").select("id, data, updated_at").eq("user_id", userId),
    supabase.from("shots").select("id, round_id, data, updated_at").eq("user_id", userId),
    supabase.from("courses").select("name, data, updated_at").eq("user_id", userId),
  ]);

  let rCount = 0, sCount = 0, cCount = 0;

  if (!roundsRes.error && roundsRes.data) {
    const localRounds = await idbListRounds();
    const localMap = new Map(localRounds.map((r) => [r.id, r]));
    for (const row of roundsRes.data as RemoteRoundRow[]) {
      const local = localMap.get(row.id);
      const remoteMs = new Date(row.updated_at).getTime();
      if (!local || remoteMs > local.updatedAt) {
        await idbSaveRound(row.data);
        rCount++;
      }
    }
  }

  if (!shotsRes.error && shotsRes.data) {
    for (const row of shotsRes.data as RemoteShotRow[]) {
      await idbSaveShot(row.round_id, row.data);
      sCount++;
    }
  }

  if (!coursesRes.error && coursesRes.data) {
    for (const row of coursesRes.data as RemoteCourseRow[]) {
      await idbUpsertCourse(row.data);
      cCount++;
    }
  }

  // Game sessions — best-effort; table may not exist yet.
  try {
    const gsRes = await supabase
      .from("game_sessions")
      .select("id, data, updated_at")
      .eq("user_id", userId);
    if (!gsRes.error && gsRes.data) {
      for (const row of gsRes.data as { id: string; data: GameSession }[]) {
        await idbSaveGameSession(row.data);
      }
    }
  } catch {
    /* game_sessions table not provisioned — ignore */
  }

  return { rounds: rCount, shots: sCount, courses: cCount };
}

// ---------- Full push (initial sync of local → remote) ----------

export async function pushAll(): Promise<{ rounds: number; shots: number; courses: number }> {
  if (!getCurrentUserId()) return { rounds: 0, shots: 0, courses: 0 };

  const rounds = await idbListRounds();
  let sCount = 0;
  for (const r of rounds) {
    // Round MUST be pushed before its shots (FK dependency).
    await pushRound(r);
    const shots = await idbGetShotsForRound(r.id);
    for (const s of shots) {
      await pushShot(r.id, s);
      sCount++;
    }
  }
  const courses = await idbListCourses();
  for (const c of courses) await pushCourse(c);
  const sessions = await idbListGameSessions();
  for (const s of sessions) await pushGameSession(s);
  return { rounds: rounds.length, shots: sCount, courses: courses.length };
}

// ---------- Full local wipe ----------

export async function wipeAllLocal(): Promise<void> {
  const rounds = await idbListRounds();
  for (const r of rounds) await idbDeleteRound(r.id);
  const courses = await idbListCourses();
  for (const c of courses) await idbDeleteCourse(c.name);
}

// ---------- Delete a single round everywhere ----------

export async function deleteRoundEverywhere(roundId: string): Promise<void> {
  await idbDeleteRound(roundId);
  void deleteRoundRemote(roundId);
}

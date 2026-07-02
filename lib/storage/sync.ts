/**
 * Cloud sync — mirrors local IndexedDB to Supabase.
 *
 * Model: IndexedDB is the primary write target (offline-first). Sync runs
 * on login, on manual trigger, and after every local write.
 *
 * Conflict resolution: last-writer-wins by `updatedAt`.
 */

"use client";

import { supabase } from "@/lib/supabase/client";
import {
  listRounds as idbListRounds,
  saveRound as idbSaveRound,
  deleteRound as idbDeleteRound,
  getShotsForRound as idbGetShotsForRound,
  saveShot as idbSaveShot,
  deleteShot as idbDeleteShot,
  listCourses as idbListCourses,
  upsertCourse as idbUpsertCourse,
} from "./local";
import type { StoredRound, StoredShot, StoredCourse } from "./types";

// ---------- Round sync ----------

export async function pushRound(round: StoredRound): Promise<void> {
  const { data: sess } = await supabase.auth.getUser();
  const userId = sess.user?.id;
  if (!userId) return;
  const { error } = await supabase.from("rounds").upsert({
    id: round.id,
    user_id: userId,
    data: round,
    updated_at: new Date(round.updatedAt).toISOString(),
  });
  if (error) console.error("pushRound:", error);
}

export async function pushShot(roundId: string, shot: StoredShot): Promise<void> {
  const { data: sess } = await supabase.auth.getUser();
  const userId = sess.user?.id;
  if (!userId) return;
  const { error } = await supabase.from("shots").upsert({
    id: shot.id,
    round_id: roundId,
    user_id: userId,
    data: shot,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("pushShot:", error);
}

export async function pushCourse(course: StoredCourse): Promise<void> {
  const { data: sess } = await supabase.auth.getUser();
  const userId = sess.user?.id;
  if (!userId) return;
  const { error } = await supabase.from("courses").upsert({
    name: course.name,
    user_id: userId,
    data: course,
    updated_at: new Date(course.lastUsedAt).toISOString(),
  });
  if (error) console.error("pushCourse:", error);
}

export async function deleteRoundRemote(roundId: string): Promise<void> {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user?.id) return;
  await supabase.from("rounds").delete().eq("id", roundId);
  // shots cascade via FK
}

export async function deleteShotRemote(shotId: string): Promise<void> {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user?.id) return;
  await supabase.from("shots").delete().eq("id", shotId);
}

// ---------- Full pull (on login) ----------

interface RemoteRoundRow { id: string; data: StoredRound; updated_at: string }
interface RemoteShotRow { id: string; round_id: string; data: StoredShot; updated_at: string }
interface RemoteCourseRow { name: string; data: StoredCourse; updated_at: string }

export async function pullAll(): Promise<{ rounds: number; shots: number; courses: number }> {
  const { data: sess } = await supabase.auth.getUser();
  const userId = sess.user?.id;
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

  return { rounds: rCount, shots: sCount, courses: cCount };
}

// ---------- Full push (initial sync of local → remote) ----------

export async function pushAll(): Promise<{ rounds: number; shots: number; courses: number }> {
  const { data: sess } = await supabase.auth.getUser();
  if (!sess.user?.id) return { rounds: 0, shots: 0, courses: 0 };

  const rounds = await idbListRounds();
  let sCount = 0;
  for (const r of rounds) {
    await pushRound(r);
    const shots = await idbGetShotsForRound(r.id);
    for (const s of shots) {
      await pushShot(r.id, s);
      sCount++;
    }
  }
  const courses = await idbListCourses();
  for (const c of courses) await pushCourse(c);
  return { rounds: rounds.length, shots: sCount, courses: courses.length };
}

// ---------- Full local wipe (all data + auth signout is caller's choice) ----------

export async function wipeAllLocal(): Promise<void> {
  const rounds = await idbListRounds();
  for (const r of rounds) await idbDeleteRound(r.id);
  const courses = await idbListCourses();
  for (const c of courses) {
    // deleting course by name — use the helper
    const { deleteCourse } = await import("./local");
    await deleteCourse(c.name);
  }
}

// ---------- Delete a single round everywhere ----------

export async function deleteRoundEverywhere(roundId: string): Promise<void> {
  await idbDeleteRound(roundId);
  await deleteRoundRemote(roundId);
}

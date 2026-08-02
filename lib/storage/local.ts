/**
 * Local-first storage via IndexedDB.
 *
 * The app writes every shot to IndexedDB on save, then optionally
 * syncs to Supabase in the background. Rounds are draftable and
 * fully resumable — you can close the tab mid-round and pick up
 * exactly where you left off.
 */

"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { StoredRound, StoredShot, EntryMetrics, StoredCourse } from "./types";
import type { GameSession } from "@/lib/practice/types";

const DB_NAME = "golf-stats";
const DB_VERSION = 3;

interface Schema {
  rounds: { key: string; value: StoredRound };
  shots: { key: string; value: StoredShot & { roundId: string } };
  metrics: { key: string; value: EntryMetrics };
  courses: { key: string; value: StoredCourse };
  gameSessions: { key: string; value: GameSession };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("rounds")) {
          db.createObjectStore("rounds", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("shots")) {
          const shots = db.createObjectStore("shots", { keyPath: "id" });
          shots.createIndex("roundId", "roundId");
        }
        if (!db.objectStoreNames.contains("metrics")) {
          db.createObjectStore("metrics", { keyPath: "roundId" });
        }
        if (!db.objectStoreNames.contains("courses")) {
          db.createObjectStore("courses", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("gameSessions")) {
          const gs = db.createObjectStore("gameSessions", { keyPath: "id" });
          gs.createIndex("gameId", "gameId");
        }
      },
    });
  }
  return dbPromise;
}

// ---------- practice game sessions ----------

export async function saveGameSession(session: GameSession): Promise<void> {
  const db = await getDB();
  await db.put("gameSessions", session);
}

export async function listGameSessions(): Promise<GameSession[]> {
  const db = await getDB();
  const all = await db.getAll("gameSessions");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getGameSessionsForGame(gameId: string): Promise<GameSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("gameSessions", "gameId", gameId);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteGameSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("gameSessions", id);
}

// ---------- courses ----------

export async function upsertCourse(course: StoredCourse): Promise<void> {
  const db = await getDB();
  await db.put("courses", course);
}

export async function listCourses(): Promise<StoredCourse[]> {
  const db = await getDB();
  const all = await db.getAll("courses");
  return all.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export async function deleteCourse(name: string): Promise<void> {
  const db = await getDB();
  await db.delete("courses", name);
}

// ---------- rounds ----------

export async function saveRound(round: StoredRound): Promise<void> {
  const db = await getDB();
  await db.put("rounds", { ...round, updatedAt: Date.now() });
}

export async function getRound(id: string): Promise<StoredRound | undefined> {
  const db = await getDB();
  return db.get("rounds", id);
}

export async function listRounds(): Promise<StoredRound[]> {
  const db = await getDB();
  const rounds = await db.getAll("rounds");
  return rounds.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteRound(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["rounds", "shots", "metrics"], "readwrite");
  await tx.objectStore("rounds").delete(id);
  const shotIndex = tx.objectStore("shots").index("roundId");
  let cursor = await shotIndex.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.objectStore("metrics").delete(id);
  await tx.done;
}

// ---------- shots ----------

export async function saveShot(roundId: string, shot: StoredShot): Promise<void> {
  const db = await getDB();
  await db.put("shots", { ...shot, roundId });
}

export async function deleteShot(shotId: string): Promise<void> {
  const db = await getDB();
  await db.delete("shots", shotId);
}

export async function getShotsForRound(roundId: string): Promise<StoredShot[]> {
  const db = await getDB();
  const shots = await db.getAllFromIndex("shots", "roundId", roundId);
  return shots.sort((a, b) => {
    if (a.holeNumber !== b.holeNumber) return a.holeNumber - b.holeNumber;
    return a.shotNumber - b.shotNumber;
  });
}

// ---------- metrics ----------

export async function saveMetrics(metrics: EntryMetrics): Promise<void> {
  const db = await getDB();
  await db.put("metrics", metrics);
}

export async function getMetrics(roundId: string): Promise<EntryMetrics | undefined> {
  const db = await getDB();
  return db.get("metrics", roundId);
}

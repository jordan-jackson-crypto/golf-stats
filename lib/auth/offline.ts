"use client";

/**
 * Offline mode — lets the user into the app using only local IndexedDB data
 * when Supabase is unreachable (e.g. the free-tier project is paused, or no
 * signal on the course). Writes stay local and sync later when a real session
 * exists. This guarantees a dead database can never wall the user off from
 * their own on-device rounds.
 */

const OFFLINE_KEY = "golf-stats-offline";

export function isOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OFFLINE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOfflineMode(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(OFFLINE_KEY, "1");
    else window.localStorage.removeItem(OFFLINE_KEY);
  } catch {
    /* ignore */
  }
}

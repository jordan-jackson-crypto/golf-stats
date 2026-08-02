"use client";

/**
 * Cached user id. Set once by AuthProvider on auth state change, read
 * synchronously by the sync layer so writes never trigger a network
 * round-trip to the auth server (`getUser()` hits the network; this does not).
 */

let currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

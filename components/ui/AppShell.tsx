"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { TabBar } from "./TabBar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pullAll, pushAll, heartbeat } from "@/lib/storage/sync";
import { isOfflineMode, setOfflineMode } from "@/lib/auth/offline";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, user } = useAuth();
  const syncedForUser = useRef<string | null>(null);
  const [offline, setOffline] = useState(false);

  // Track offline-mode flag (client-only).
  useEffect(() => {
    setOffline(isOfflineMode());
  }, [pathname]);

  // A real session supersedes offline mode — clear the flag on sign-in.
  useEffect(() => {
    if (session && isOfflineMode()) {
      setOfflineMode(false);
      setOffline(false);
    }
  }, [session]);

  // Auth guard: send unauthenticated users to /login — UNLESS they've chosen
  // offline mode, in which case they use the app from local data.
  useEffect(() => {
    if (loading) return;
    const allowed = !!session || isOfflineMode();
    if (!allowed && pathname !== "/login") {
      router.replace("/login");
    } else if (session && pathname === "/login") {
      router.replace("/rounds");
    }
  }, [loading, session, pathname, router]);

  // On login: heartbeat (resets pause timer), then pull remote + push local.
  useEffect(() => {
    if (!user) {
      syncedForUser.current = null;
      return;
    }
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;
    (async () => {
      try {
        await heartbeat();
        await pullAll();
        await pushAll();
      } catch (e) {
        console.error("initial sync failed:", e);
      }
    })();
  }, [user]);

  // Auth pages: no chrome
  if (pathname === "/login") {
    return <div className="mx-auto max-w-md">{children}</div>;
  }

  const offlineBanner = offline && !session ? <OfflineBanner /> : null;

  // Full-viewport routes (no tab bar): shot entry + practice game detail,
  // both of which have their own sticky bottom action bar.
  const isRoundEntry = /^\/rounds\/[^/]+$/.test(pathname) && !pathname.endsWith("/summary");
  const isGameDetail = /^\/practice\/[^/]+$/.test(pathname);
  if (isRoundEntry || isGameDetail) {
    return <div className="mx-auto max-w-md">{children}</div>;
  }

  return (
    <>
      {offlineBanner}
      <main className="mx-auto max-w-md pb-20 pt-safe">{children}</main>
      <TabBar />
    </>
  );
}

function OfflineBanner() {
  return (
    <Link
      href="/login"
      className="mx-auto flex max-w-md items-center justify-center gap-1.5 bg-amber-500/15 px-3 py-1.5 text-[11px] text-amber-500"
    >
      <CloudOff size={12} />
      Offline — changes saved on this device only. Tap to sign in &amp; sync.
    </Link>
  );
}

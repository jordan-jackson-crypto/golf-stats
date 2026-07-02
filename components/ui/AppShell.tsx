"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { TabBar } from "./TabBar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pullAll, pushAll } from "@/lib/storage/sync";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, user } = useAuth();
  const syncedForUser = useRef<string | null>(null);

  // Auth guard: redirect unauthenticated users to /login (except on /login itself)
  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    } else if (session && pathname === "/login") {
      router.replace("/rounds");
    }
  }, [loading, session, pathname, router]);

  // Sync on login: pull remote, then push local (once per user session)
  useEffect(() => {
    if (!user) {
      syncedForUser.current = null;
      return;
    }
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;
    (async () => {
      try {
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

  // Full-viewport routes: shot entry (no tab bar)
  const isFullViewport = /^\/rounds\/[^/]+$/.test(pathname) && !pathname.endsWith("/summary");
  if (isFullViewport) {
    return <div className="mx-auto max-w-md">{children}</div>;
  }

  return (
    <>
      <main className="mx-auto max-w-md pb-20 pt-safe">{children}</main>
      <TabBar />
    </>
  );
}

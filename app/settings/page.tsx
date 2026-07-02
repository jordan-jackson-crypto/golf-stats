"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listRounds, deleteRound } from "@/lib/storage";
import { pullAll, pushAll, wipeAllLocal } from "@/lib/storage/sync";
import type { StoredRound } from "@/lib/storage/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [rounds, setRounds] = useState<StoredRound[]>([]);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const refresh = () => listRounds().then(setRounds);
  useEffect(() => { refresh(); }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const pulled = await pullAll();
      const pushed = await pushAll();
      setSyncMsg(
        `Pulled ${pulled.rounds}r / ${pulled.shots}s · Pushed ${pushed.rounds}r / ${pushed.shots}s`,
      );
      await refresh();
    } catch (e) {
      setSyncMsg("Sync failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncing(false);
    }
  };

  const doWipe = async () => {
    await wipeAllLocal();
    setConfirmWipe(false);
    await refresh();
  };

  const doDeleteRound = async (id: string) => {
    if (!confirm("Delete this round? This cannot be undone.")) return;
    await deleteRound(id);
    await refresh();
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/rounds" className="p-1 text-fg-muted"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Account */}
      <section className="mb-6">
        <h2 className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Account</h2>
        <div className="rounded-lg border border-border bg-bg-raised p-3">
          <div className="text-xs text-fg-faint">Signed in as</div>
          <div className="text-sm text-fg">{user?.email ?? "—"}</div>
          <button
            type="button"
            onClick={async () => { await signOut(); router.replace("/login"); }}
            className="mt-3 flex items-center gap-1.5 text-xs text-fg-muted underline"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </section>

      {/* Sync */}
      <section className="mb-6">
        <h2 className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Cloud sync</h2>
        <div className="rounded-lg border border-border bg-bg-raised p-3">
          <div className="text-xs text-fg-muted">
            Rounds and shots sync automatically. Trigger a manual sync if you want to be certain.
          </div>
          <button
            type="button"
            onClick={runSync}
            disabled={syncing}
            className={cn(
              "mt-3 flex items-center gap-1.5 rounded-md border border-border bg-bg px-3 py-1.5 text-xs",
              syncing ? "text-fg-faint" : "text-fg active:bg-bg-muted",
            )}
          >
            <RefreshCw size={12} className={cn(syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          {syncMsg && <div className="mt-2 text-[11px] text-fg-muted">{syncMsg}</div>}
        </div>
      </section>

      {/* Rounds — with delete */}
      <section className="mb-6">
        <h2 className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-wide text-fg-faint">
          <span>Manage rounds</span>
          <span className="text-fg-faint">{rounds.length} total</span>
        </h2>
        <div className="space-y-2">
          {rounds.length === 0 && (
            <div className="rounded-lg border border-border bg-bg-raised p-3 text-xs text-fg-faint">
              No rounds yet.
            </div>
          )}
          {rounds.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-raised px-3 py-2"
            >
              <div>
                <div className="text-sm text-fg">{r.courseName}</div>
                <div className="text-[10px] text-fg-faint">
                  {r.date} · {r.status} · score {r.totalScore ?? "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => doDeleteRound(r.id)}
                className="rounded-md p-2 text-fg-muted active:bg-bg-muted"
                aria-label="Delete round"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Danger zone</h2>
        <div className="rounded-lg border border-sg-loss/40 bg-sg-loss/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-sg-loss" />
            <div className="text-xs text-fg-muted">
              Wipes all local rounds, shots, and courses on this device. Data stored in the cloud
              is <em>not</em> touched — the next sync will pull it back down.
            </div>
          </div>
          {!confirmWipe ? (
            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="mt-3 rounded-md border border-sg-loss/60 px-3 py-1.5 text-xs text-sg-loss active:bg-sg-loss/10"
            >
              Wipe all local data
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={doWipe}
                className="rounded-md bg-sg-loss px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Yes, wipe
              </button>
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-fg-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

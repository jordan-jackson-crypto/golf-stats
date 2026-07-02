"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listRounds } from "@/lib/storage";
import type { StoredRound } from "@/lib/storage/types";
import { fmtSG, sgColorClass } from "@/lib/utils";
import { Plus, Settings } from "lucide-react";

export default function RoundsPage() {
  const [rounds, setRounds] = useState<StoredRound[] | null>(null);

  useEffect(() => {
    listRounds().then(setRounds);
  }, []);

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Rounds</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted"
            aria-label="Settings"
          >
            <Settings size={16} />
          </Link>
          <Link
            href="/rounds/new"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
          >
            <Plus size={16} strokeWidth={2.5} />
            New
          </Link>
        </div>
      </div>

      {rounds === null ? (
        <div className="text-fg-faint">Loading…</div>
      ) : rounds.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-faint">
          No rounds yet. Tap <span className="text-fg">New</span> to log one.
        </div>
      ) : (
        <ul className="space-y-2">
          {rounds.map((r) => (
            <li key={r.id}>
              <Link
                href={r.status === "draft" ? `/rounds/${r.id}` : `/rounds/${r.id}/summary`}
                className="block rounded-lg border border-border bg-bg-raised p-3"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-medium text-fg">{r.courseName}</div>
                    <div className="text-xs text-fg-faint">
                      {r.date} {r.status === "draft" && "· draft"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-lg font-medium text-fg">
                      {r.totalScore ?? "—"}
                    </div>
                    <div className={`num text-xs ${sgColorClass(r.sgTotal ?? 0)}`}>
                      SG {r.sgTotal != null ? fmtSG(r.sgTotal) : "—"}
                    </div>
                  </div>
                </div>
                {r.sgTotal != null && (
                  <div className="mt-2 grid grid-cols-4 gap-1 border-t border-border pt-2 text-[10px] uppercase tracking-wide text-fg-faint">
                    <SGCell label="OTT" v={r.sgOTT} />
                    <SGCell label="APP" v={r.sgAPP} />
                    <SGCell label="ARG" v={r.sgARG} />
                    <SGCell label="PUTT" v={r.sgPUTT} />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SGCell({ label, v }: { label: string; v: number | undefined }) {
  return (
    <div className="text-center">
      <div>{label}</div>
      <div className={`num text-[13px] font-medium normal-case ${sgColorClass(v ?? 0)}`}>
        {v != null ? fmtSG(v) : "—"}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRound, getShotsForRound, getMetrics } from "@/lib/storage";
import type { StoredRound, StoredShot, EntryMetrics } from "@/lib/storage/types";
import { scoreShots } from "@/lib/entry/scoreDraft";
import { cn, fmtSG, sgColorClass } from "@/lib/utils";
import { TIGER5_TARGETS_ONE_HCP } from "@/lib/tiger5";

export default function RoundSummaryPage() {
  const params = useParams<{ id: string }>();
  const [round, setRound] = useState<StoredRound | null>(null);
  const [shots, setShots] = useState<StoredShot[]>([]);
  const [metrics, setMetrics] = useState<EntryMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await getRound(params.id);
        if (!r) {
          setErr("Round not found");
          return;
        }
        setRound(r);
        const s = await getShotsForRound(params.id);
        setShots(scoreShots(s, r.parPerHole ?? Array(18).fill(4)));
        setMetrics((await getMetrics(params.id)) ?? null);
      } catch (e) {
        console.error("summary load failed:", e);
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [params.id]);

  if (err) return <div className="p-6 text-sg-loss">Failed to load: {err}</div>;
  if (!round) return <div className="p-6 text-fg-faint">Loading…</div>;

  const holeCount = round.holeCount ?? 18;
  const parPerHole = round.parPerHole ?? Array(holeCount).fill(4);
  const totalPar = parPerHole.slice(0, holeCount).reduce((a, b) => a + b, 0);
  const toPar = (round.totalScore ?? 0) - totalPar;

  const holeRows = Array.from({ length: holeCount }, (_, i) => {
    const hole = i + 1;
    const par = parPerHole[i] ?? 4;
    const hs = shots.filter((s) => s.holeNumber === hole);
    const score = hs.length + hs.filter((s) => s.penalty).length;
    const sg = hs.reduce((sum, s) => sum + (s.sg ?? 0), 0);
    return { hole, par, score: hs.length ? score : null, sg: hs.length ? sg : null };
  });

  return (
    <div className="pb-4">
      <div className="border-b border-border px-3 py-3">
        <div className="mb-1 flex items-center gap-2">
          <Link href="/rounds" className="p-1 text-fg-muted">
            <ArrowLeft size={18} />
          </Link>
          <div className="text-[10px] uppercase tracking-wide text-fg-faint">
            {round.date} · {holeCount} holes
          </div>
        </div>
        <div className="text-lg font-semibold">{round.courseName}</div>
        {(round.courseRating != null || round.courseSlope != null) && (
          <div className="num mt-0.5 text-[11px] text-fg-faint">
            {round.courseRating != null && `${round.courseRating}`}
            {round.courseRating != null && round.courseSlope != null && " / "}
            {round.courseSlope != null && `${round.courseSlope}`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
        <StatBlock label="Score" value={round.totalScore ?? "—"} sub={`Par ${totalPar}`} />
        <StatBlock
          label="To par"
          value={`${toPar > 0 ? "+" : ""}${toPar}`}
          sub={round.sgTotal != null ? `SG ${fmtSG(round.sgTotal)}` : ""}
          valueClass={sgColorClass(-toPar)}
        />
      </div>

      <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
        <SGBlock label="OTT" v={round.sgOTT} />
        <SGBlock label="APP" v={round.sgAPP} />
        <SGBlock label="ARG" v={round.sgARG} />
        <SGBlock label="PUTT" v={round.sgPUTT} />
      </div>

      {round.tiger5 && (
        <div className="border-b border-border px-3 py-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-fg-faint">Tiger 5</div>
          <ul className="space-y-1 text-xs">
            <Tiger5Row label="Double bogeys" count={round.tiger5.doubleBogeys} target={TIGER5_TARGETS_ONE_HCP.doubleBogeys} />
            <Tiger5Row label="Par-5 bogeys+" count={round.tiger5.par5BogeysOrWorse} target={TIGER5_TARGETS_ONE_HCP.par5BogeysOrWorse} />
            <Tiger5Row label="Three-putts" count={round.tiger5.threePutts} target={TIGER5_TARGETS_ONE_HCP.threePutts} />
            <Tiger5Row label="Bogeys ≤150" count={round.tiger5.bogeysFrom150OrIn} target={TIGER5_TARGETS_ONE_HCP.bogeysFrom150OrIn} />
            <Tiger5Row label="Blown par saves" count={round.tiger5.blownParSaves} target={TIGER5_TARGETS_ONE_HCP.blownParSaves} />
          </ul>
        </div>
      )}

      <div className="px-3 py-3">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-fg-faint">Per hole</div>
        <div className={cn("grid gap-1", holeCount === 9 ? "grid-cols-9" : "grid-cols-9")}>
          {holeRows.map((h) => (
            <div key={h.hole} className="rounded border border-border bg-bg-raised py-1.5 text-center">
              <div className="text-[8px] text-fg-faint">{h.hole}</div>
              <div className="num text-xs">{h.score ?? "—"}</div>
              <div className={cn("num text-[9px]", sgColorClass(h.sg ?? 0))}>
                {h.sg != null ? fmtSG(h.sg, 1) : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {metrics && metrics.totalShots > 0 && (
        <div className="mx-3 mt-2 rounded border border-border bg-bg-raised px-3 py-2 text-[10px] text-fg-faint">
          <div className="mb-1 uppercase tracking-wide">Entry metrics</div>
          <div className="flex gap-3">
            <span className="num">{(metrics.totalSeconds / metrics.totalShots).toFixed(1)}s/shot</span>
            <span className="num">{(metrics.totalTaps / metrics.totalShots).toFixed(1)}taps/shot</span>
            <span className="num">total {(metrics.totalSeconds / 60).toFixed(1)}m</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, sub, valueClass }: { label: string; value: string | number; sub?: string; valueClass?: string }) {
  return (
    <div className="bg-bg px-3 py-3">
      <div className="text-[10px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cn("num text-2xl font-medium", valueClass)}>{value}</div>
      {sub && <div className="num text-[11px] text-fg-faint">{sub}</div>}
    </div>
  );
}

function SGBlock({ label, v }: { label: string; v: number | undefined }) {
  return (
    <div className="bg-bg px-2 py-2 text-center">
      <div className="text-[9px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cn("num text-sm font-medium", sgColorClass(v ?? 0))}>
        {v != null ? fmtSG(v) : "—"}
      </div>
    </div>
  );
}

function Tiger5Row({ label, count, target }: { label: string; count: number; target: number }) {
  const ok = count <= target;
  return (
    <li className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className={cn("num", ok ? "text-fg-muted" : "text-sg-loss")}>
        {count} <span className="text-fg-faint">/ {target}</span>
      </span>
    </li>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { listRounds, listAllShots } from "@/lib/storage";
import type { StoredRound } from "@/lib/storage/types";
import { cn, fmtSG, sgColorClass } from "@/lib/utils";
import { BENCHMARKS, LEVEL_LABEL, type SkillLevel } from "@/lib/benchmarks";
import { TIGER5_TARGETS_ONE_HCP } from "@/lib/tiger5";
import { analyzeShots, type ShotAnalysis, type BandStat } from "@/lib/stats/shotAnalysis";

const CATEGORIES = [
  { key: "sgOTT" as const, benchKey: "ott" as const, label: "Off the Tee", short: "OTT", help: "Tee shots on par 4/5 — mostly driver. 0 = Tour average." },
  { key: "sgAPP" as const, benchKey: "app" as const, label: "Approach", short: "APP", help: "Shots to the green from beyond 30y. The single biggest scoring skill." },
  { key: "sgARG" as const, benchKey: "arg" as const, label: "Around the Green", short: "ARG", help: "Chips, pitches and bunker shots inside 30y." },
  { key: "sgPUTT" as const, benchKey: "putt" as const, label: "Putting", short: "PUTT", help: "Everything from the green." },
];

export default function StatsPage() {
  const [rounds, setRounds] = useState<StoredRound[] | null>(null);
  const [analysis, setAnalysis] = useState<ShotAnalysis | null>(null);
  const [target, setTarget] = useState<SkillLevel>("scratch");

  useEffect(() => {
    (async () => {
      const all = await listRounds();
      setRounds(all.filter((r) => r.status === "complete"));
      const shots = await listAllShots();
      setAnalysis(analyzeShots(shots, all));
    })();
  }, []);

  const avg = useMemo(() => {
    if (!rounds || rounds.length === 0) return null;
    const withSG = rounds.filter((r) => r.sgTotal != null);
    const sum = { total: 0, ott: 0, app: 0, arg: 0, putt: 0, score: 0, toPar: 0 };
    for (const r of rounds) {
      sum.score += r.totalScore ?? 0;
      const par = (r.parPerHole ?? []).reduce((a, b) => a + b, 0);
      sum.toPar += (r.totalScore ?? 0) - par;
    }
    for (const r of withSG) {
      sum.total += r.sgTotal!;
      sum.ott += r.sgOTT ?? 0;
      sum.app += r.sgAPP ?? 0;
      sum.arg += r.sgARG ?? 0;
      sum.putt += r.sgPUTT ?? 0;
    }
    const n = rounds.length;
    const nSG = Math.max(1, withSG.length);
    return {
      score: sum.score / n,
      toPar: sum.toPar / n,
      total: sum.total / nSG,
      ott: sum.ott / nSG,
      app: sum.app / nSG,
      arg: sum.arg / nSG,
      putt: sum.putt / nSG,
    };
  }, [rounds]);

  const tiger5Avg = useMemo(() => {
    if (!rounds) return null;
    const t = rounds.filter((r) => r.tiger5);
    if (t.length === 0) return null;
    const sum = { doubleBogeys: 0, par5BogeysOrWorse: 0, threePutts: 0, bogeysFrom150OrIn: 0, blownParSaves: 0 };
    for (const r of t) {
      sum.doubleBogeys += r.tiger5!.doubleBogeys;
      sum.par5BogeysOrWorse += r.tiger5!.par5BogeysOrWorse;
      sum.threePutts += r.tiger5!.threePutts;
      sum.bogeysFrom150OrIn += r.tiger5!.bogeysFrom150OrIn;
      sum.blownParSaves += r.tiger5!.blownParSaves;
    }
    return {
      doubleBogeys: sum.doubleBogeys / t.length,
      par5BogeysOrWorse: sum.par5BogeysOrWorse / t.length,
      threePutts: sum.threePutts / t.length,
      bogeysFrom150OrIn: sum.bogeysFrom150OrIn / t.length,
      blownParSaves: sum.blownParSaves / t.length,
    };
  }, [rounds]);

  if (rounds === null) return <div className="p-6 text-fg-faint">Loading…</div>;

  if (rounds.length === 0 || !avg) {
    return (
      <div className="px-4 pt-6">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Stats</h1>
        <div className="rounded-lg border border-border bg-bg-raised p-4 text-sm text-fg-muted">
          Complete a round with shot detail to see how you stack up vs. Tour, scratch, and handicap benchmarks.
        </div>
      </div>
    );
  }

  const n = rounds.length;

  const bench = BENCHMARKS[target];

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
        <div className="text-[10px] uppercase tracking-wide text-fg-faint">Avg over {n} round{n === 1 ? "" : "s"}</div>
      </div>

      {/* Compare-to selector */}
      <div className="mt-3 rounded-lg border border-border bg-bg-raised p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-wide text-fg-faint">Compare vs.</div>
          <div className="text-[10px] text-fg-faint">Tour avg = 0.00</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["tour", "scratch", "5hcp"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setTarget(lvl)}
              className={cn(
                "rounded-md border py-1.5 text-[11px]",
                target === lvl
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg text-fg-muted",
              )}
            >
              {LEVEL_LABEL[lvl]}
            </button>
          ))}
        </div>
      </div>

      {/* Score header */}
      <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <Kpi label="Avg score" v={avg.score.toFixed(1)} />
        <Kpi
          label="To par"
          v={`${avg.toPar > 0 ? "+" : ""}${avg.toPar.toFixed(1)}`}
          cls={sgColorClass(-avg.toPar)}
        />
        <Kpi label="SG total" v={fmtSG(avg.total)} cls={sgColorClass(avg.total)} />
      </div>

      {/* Category cards */}
      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">Strokes Gained by category</h2>
      <div className="space-y-2">
        {CATEGORIES.map((c) => {
          const value = avg[c.benchKey];
          const targetBench = bench[c.benchKey];
          const delta = value - targetBench;
          return (
            <CategoryCard
              key={c.key}
              label={c.label}
              short={c.short}
              help={c.help}
              value={value}
              targetBench={targetBench}
              delta={delta}
              targetLabel={LEVEL_LABEL[target]}
            />
          );
        })}
      </div>

      {/* Tiger 5 */}
      {tiger5Avg && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">Tiger 5 · per round</h2>
          <div className="space-y-1 rounded-lg border border-border bg-bg-raised p-3">
            <Tiger5Row label="Doubles+" count={tiger5Avg.doubleBogeys} target={TIGER5_TARGETS_ONE_HCP.doubleBogeys} help="Any hole played 2+ over par" />
            <Tiger5Row label="Par-5 bogey+" count={tiger5Avg.par5BogeysOrWorse} target={TIGER5_TARGETS_ONE_HCP.par5BogeysOrWorse} help="Par 5 played over par" />
            <Tiger5Row label="Three-putts" count={tiger5Avg.threePutts} target={TIGER5_TARGETS_ONE_HCP.threePutts} help="Three or more putts on a hole" />
            <Tiger5Row label="Bogeys ≤150y" count={tiger5Avg.bogeysFrom150OrIn} target={TIGER5_TARGETS_ONE_HCP.bogeysFrom150OrIn} help="Bogey on a hole where approach was inside 150y" />
            <Tiger5Row label="Blown par saves" count={tiger5Avg.blownParSaves} target={TIGER5_TARGETS_ONE_HCP.blownParSaves} help="Missed par-saving putt inside 8 ft" />
          </div>
        </>
      )}

      {/* SG by approach distance — the key diagnostic */}
      {analysis && analysis.totalApproachShots > 0 && (
        <>
          <h2 className="mt-6 mb-1 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            SG by approach distance
          </h2>
          <p className="mb-2 text-[11px] text-fg-faint">
            Avg strokes gained per shot vs Tour, by distance to the pin. Your biggest leaks live here.
          </p>
          <BandChart bands={analysis.approachByDistance} unit="/shot" />
        </>
      )}

      {/* Approach SG by lie */}
      {analysis && analysis.approachByLie.some((b) => b.shots > 0) && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Approach SG by lie
          </h2>
          <BandChart bands={analysis.approachByLie.filter((b) => b.shots > 0)} unit="/shot" />
        </>
      )}

      {/* Putting SG by distance */}
      {analysis && analysis.totalPutts > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Putting SG by distance
          </h2>
          <BandChart bands={analysis.puttingByDistance} unit="/shot" />
        </>
      )}

      {/* What SG means */}
      <div className="mt-6 rounded-lg border border-border bg-bg-raised p-3 text-[11px] leading-relaxed text-fg-muted">
        <div className="mb-1 font-semibold uppercase tracking-wide text-fg-faint">What SG means</div>
        Strokes Gained measures each shot against the expected number of strokes a PGA Tour pro would take from that lie + distance. Positive = better than tour. Negative = worse. Scratch amateur avg ≈ {BENCHMARKS.scratch.total.toFixed(1)} SG total per round vs Tour.
      </div>
    </div>
  );
}

// ---------- distance-band chart ----------

function BandChart({ bands, unit }: { bands: BandStat[]; unit: string }) {
  // Symmetric diverging bar around 0, scaled to the largest magnitude present.
  const maxMag = Math.max(0.25, ...bands.map((b) => Math.abs(b.avgSG)));
  return (
    <div className="space-y-1.5">
      {bands.map((b) => {
        const hasData = b.shots > 0;
        const frac = hasData ? Math.min(1, Math.abs(b.avgSG) / maxMag) : 0;
        const isGain = b.avgSG >= 0;
        return (
          <div key={b.key} className="flex items-center gap-2">
            <div className="num w-16 shrink-0 text-right text-[11px] text-fg-muted">{b.label}</div>
            {/* diverging bar: center line, gain right / loss left */}
            <div className="relative h-5 flex-1 rounded bg-bg-raised">
              <div className="absolute left-1/2 top-0 h-full w-px bg-border-strong" />
              {hasData && (
                <div
                  className={cn("absolute top-1/2 h-3 -translate-y-1/2 rounded", isGain ? "bg-sg-gain" : "bg-sg-loss")}
                  style={{
                    width: `${frac * 50}%`,
                    left: isGain ? "50%" : undefined,
                    right: isGain ? undefined : "50%",
                  }}
                />
              )}
            </div>
            <div className={cn("num w-12 shrink-0 text-right text-[11px]", sgColorClass(b.avgSG))}>
              {hasData ? fmtSG(b.avgSG) : "—"}
            </div>
            <div className="num w-6 shrink-0 text-right text-[9px] text-fg-faint">{b.shots || ""}</div>
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="w-16 shrink-0" />
        <div className="flex-1 text-center text-[9px] text-fg-faint">← losing · Tour avg · gaining →</div>
        <div className="w-12 shrink-0 text-right text-[9px] text-fg-faint">SG{unit}</div>
        <div className="w-6 shrink-0 text-right text-[9px] text-fg-faint">n</div>
      </div>
    </div>
  );
}

// ---------- sub-components ----------

function Kpi({ label, v, cls }: { label: string; v: string; cls?: string }) {
  return (
    <div className="bg-bg px-3 py-3">
      <div className="text-[10px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cn("num text-xl font-medium", cls)}>{v}</div>
    </div>
  );
}

function CategoryCard({
  label, short, help, value, targetBench, delta, targetLabel,
}: {
  label: string; short: string; help: string;
  value: number; targetBench: number; delta: number; targetLabel: string;
}) {
  // Bar shows position on a scale from -3 SG to +1 SG
  const min = -3, max = 1;
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const pct = (n: number) => ((clamp(n) - min) / (max - min)) * 100;

  const yourPct = pct(value);
  const targetPct = pct(targetBench);
  const scratchPct = pct(BENCHMARKS.scratch[short.toLowerCase() as "ott" | "app" | "arg" | "putt"]);
  const tourPct = pct(0);

  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  const positioning = Math.abs(delta) < 0.1
    ? `at ${targetLabel} level`
    : delta > 0
      ? `${deltaStr} above ${targetLabel}`
      : `${deltaStr} vs ${targetLabel}`;

  return (
    <div className="rounded-lg border border-border bg-bg-raised p-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-[10px] text-fg-faint">{help}</div>
        </div>
        <div className="text-right">
          <div className={cn("num text-lg font-medium", sgColorClass(value))}>{fmtSG(value)}</div>
          <div className={cn("text-[10px]", sgColorClass(delta))}>{positioning}</div>
        </div>
      </div>

      {/* Benchmark bar */}
      <div className="relative mt-3 h-1.5 rounded-full bg-bg">
        {/* Scratch marker */}
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-fg-faint"
          style={{ left: `${scratchPct}%` }}
          title="Scratch"
        />
        {/* Tour marker */}
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-fg"
          style={{ left: `${tourPct}%` }}
          title="Tour"
        />
        {/* Target marker */}
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-primary/70"
          style={{ left: `${targetPct}%` }}
          title={targetLabel}
        />
        {/* Your dot */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-raised bg-primary shadow"
          style={{ left: `${yourPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] tabular-nums text-fg-faint">
        <span>−3</span>
        <span>Scratch</span>
        <span>Tour 0.0</span>
        <span>+1</span>
      </div>
    </div>
  );
}

function Tiger5Row({ label, count, target, help }: { label: string; count: number; target: number; help: string }) {
  const over = count - target;
  const ok = over <= 0.05;
  return (
    <div className="flex items-start justify-between py-1">
      <div className="flex-1 pr-3">
        <div className="text-xs text-fg">{label}</div>
        <div className="text-[10px] text-fg-faint">{help}</div>
      </div>
      <div className="text-right">
        <div className={cn("num text-sm", ok ? "text-fg" : "text-sg-loss")}>
          {count.toFixed(2)} <span className="text-fg-faint">/ {target.toFixed(2)}</span>
        </div>
        <div className={cn("num text-[10px]", ok ? "text-sg-gain" : "text-sg-loss")}>
          {ok ? "✓ on target" : `+${over.toFixed(2)} over`}
        </div>
      </div>
    </div>
  );
}

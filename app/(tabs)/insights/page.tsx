"use client";

import { useEffect, useMemo, useState } from "react";
import { listRounds } from "@/lib/storage";
import type { StoredRound } from "@/lib/storage/types";
import { generateInsights, type Insight, type InsightSeverity } from "@/lib/insights/engine";
import { LEVEL_LABEL, type SkillLevel } from "@/lib/benchmarks";
import { cn } from "@/lib/utils";
import { buildMentalLibrary, MENTAL_BY_TAG, PHASE_LABEL, type MentalLibrary as MentalLibraryData, type MentalTagStat } from "@/lib/mental";
import { AlertTriangle, TrendingDown, Info, CheckCircle2, Target, Brain, ChevronDown } from "lucide-react";

export default function InsightsPage() {
  const [rounds, setRounds] = useState<StoredRound[] | null>(null);
  const [target, setTarget] = useState<SkillLevel>("scratch");

  useEffect(() => {
    listRounds().then((all) => setRounds(all.filter((r) => r.status === "complete")));
  }, []);

  const insights = useMemo(() => (rounds ? generateInsights(rounds, target) : []), [rounds, target]);
  const mental = useMemo(() => (rounds ? buildMentalLibrary(rounds) : null), [rounds]);

  if (rounds === null) return <div className="p-6 text-fg-faint">Loading…</div>;

  if (rounds.length < 3) {
    return (
      <div className="px-4 pt-6">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Insights</h1>
        <div className="rounded-lg border border-border bg-bg-raised p-4">
          <div className="text-sm text-fg">Log at least 3 rounds to unlock insights.</div>
          <div className="mt-1 text-xs text-fg-faint">
            You have {rounds.length}. Log shot detail on each hole for the fullest analysis.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
        <div className="text-[10px] uppercase tracking-wide text-fg-faint">
          Last {rounds.length} rounds
        </div>
      </div>

      {/* Target selector */}
      <div className="mt-3 rounded-lg border border-border bg-bg-raised p-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Ranking your game vs.</div>
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

      {/* Insight cards */}
      <div className="mt-4 space-y-3">
        {insights.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-raised p-3 text-sm text-fg-faint">
            Not enough data yet — keep logging rounds.
          </div>
        ) : (
          insights.map((i, idx) => <InsightCard key={i.id} insight={i} rank={idx + 1} />)
        )}
      </div>

      {/* Library of mental mistakes */}
      {mental && <MentalLibrarySection lib={mental} rounds={rounds.length} />}
    </div>
  );
}

// ---------- library of mental mistakes ----------

function MentalLibrarySection({ lib, rounds }: { lib: MentalLibraryData; rounds: number }) {
  const [openTag, setOpenTag] = useState<string | null>(null);
  const [showAllLog, setShowAllLog] = useState(false);

  const maxCount = Math.max(1, ...lib.tagStats.map((t) => t.count));
  const withNotes = lib.entries.filter((e) => e.detail.note || e.detail.tags.length > 0);
  const log = showAllLog ? withNotes : withNotes.slice(0, 6);

  return (
    <section className="mt-8">
      <div className="mb-1 flex items-center gap-2">
        <Brain size={16} className="text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Library of mental mistakes
        </h2>
      </div>
      <p className="mb-3 text-[11px] leading-snug text-fg-faint">
        Everything you flagged as a mental mistake, rolled up. Shot quality is a skill; this is a
        habit — and habits show up as patterns long before they show up in your swing.
      </p>

      {lib.totalFlagged === 0 ? (
        <div className="rounded-lg border border-border bg-bg-raised p-3 text-xs text-fg-muted">
          Nothing flagged yet. Tick <span className="text-fg">Mental mistake</span> on a hole and tag
          what kind it was — the library builds itself from there.
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
            <MiniKpi label="Per round" v={lib.perRound.toFixed(1)} sub={`${lib.totalFlagged} over ${rounds}`} />
            <MiniKpi
              label="Strokes given"
              v={`+${lib.strokesOverPar}`}
              sub="over par on those holes"
              cls={lib.strokesOverPar > 0 ? "text-sg-loss" : undefined}
            />
            <MiniKpi
              label="Clean holes"
              v={lib.baselineToPar != null ? `${lib.baselineToPar > 0 ? "+" : ""}${lib.baselineToPar.toFixed(2)}` : "—"}
              sub="avg vs par"
            />
          </div>

          {/* Tag breakdown */}
          {lib.tagStats.length > 0 ? (
            <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-bg-raised p-3">
              {lib.tagStats.map((t) => (
                <TagRow
                  key={t.tag}
                  stat={t}
                  maxCount={maxCount}
                  open={openTag === t.tag}
                  onToggle={() => setOpenTag(openTag === t.tag ? null : t.tag)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-border bg-bg-raised p-3 text-xs text-fg-muted">
              {lib.totalFlagged} flagged, none tagged yet. Tag the kind of mistake on the hole to see
              the pattern.
            </div>
          )}

          {/* Where it happens */}
          {lib.phaseCounts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lib.phaseCounts.map((p) => (
                <span
                  key={p.phase}
                  className="num rounded-full border border-border bg-bg-raised px-2.5 py-1 text-[11px] text-fg-muted"
                >
                  {PHASE_LABEL[p.phase]} · {p.count}
                </span>
              ))}
            </div>
          )}

          {/* The log */}
          {log.length > 0 && (
            <>
              <h3 className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                The log
              </h3>
              <div className="space-y-2">
                {log.map((e, i) => (
                  <div
                    key={`${e.roundId}-${e.hole}-${i}`}
                    className="rounded-lg border border-border bg-bg-raised p-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[11px] text-fg-muted">
                        {e.date} · {e.courseName} · hole {e.hole}
                      </div>
                      {e.toPar != null && (
                        <div className={cn("num text-[11px]", e.toPar > 0 ? "text-sg-loss" : "text-sg-gain")}>
                          {e.toPar > 0 ? `+${e.toPar}` : e.toPar === 0 ? "par" : String(e.toPar)}
                        </div>
                      )}
                    </div>
                    {e.detail.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {e.detail.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-sg-loss/15 px-2 py-0.5 text-[10px] text-fg"
                          >
                            {MENTAL_BY_TAG[tag]?.label ?? tag}
                          </span>
                        ))}
                        {e.detail.phase && (
                          <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-fg-faint">
                            {PHASE_LABEL[e.detail.phase]}
                          </span>
                        )}
                      </div>
                    )}
                    {e.detail.note && (
                      <p className="mt-1.5 text-xs leading-snug text-fg">&ldquo;{e.detail.note}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
              {withNotes.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllLog((v) => !v)}
                  className="mt-2 w-full rounded-lg border border-border bg-bg-raised py-2 text-[11px] text-fg-muted"
                >
                  {showAllLog ? "Show less" : `Show all ${withNotes.length}`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function TagRow({
  stat, maxCount, open, onToggle,
}: {
  stat: MentalTagStat; maxCount: number; open: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 py-1 text-left">
        <div className="w-28 shrink-0 text-xs text-fg">{stat.meta.label}</div>
        <div className="h-2 flex-1 rounded-full bg-bg">
          <div
            className="h-2 rounded-full bg-sg-loss"
            style={{ width: `${(stat.count / maxCount) * 100}%` }}
          />
        </div>
        <div className="num w-8 shrink-0 text-right text-[11px] text-fg-muted">{stat.count}</div>
        <div className="num w-10 shrink-0 text-right text-[11px] text-sg-loss">
          {stat.strokesOverPar > 0 ? `+${stat.strokesOverPar}` : "—"}
        </div>
        <ChevronDown
          size={12}
          className={cn("shrink-0 text-fg-faint transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mb-1 ml-0 space-y-1.5 rounded-lg bg-bg p-2.5">
          <p className="text-[11px] leading-snug text-fg-muted">
            <span className="text-fg-faint">What it is · </span>
            {stat.meta.what}
          </p>
          <p className="text-[11px] leading-snug text-fg-muted">
            <span className="text-fg-faint">What it costs · </span>
            {stat.meta.cost}
          </p>
          <div className="flex items-start gap-1.5 rounded-md bg-bg-raised px-2 py-1.5">
            <Target size={11} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-[11px] leading-snug text-fg">{stat.meta.cue}</div>
          </div>
          <div className="num text-[10px] text-fg-faint">
            {stat.avgToPar != null && `${stat.avgToPar > 0 ? "+" : ""}${stat.avgToPar.toFixed(1)} avg vs par · `}
            {stat.lastSeen && `last seen ${stat.lastSeen}`}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniKpi({ label, v, sub, cls }: { label: string; v: string; sub?: string; cls?: string }) {
  return (
    <div className="bg-bg px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cn("num text-lg font-medium", cls)}>{v}</div>
      {sub && <div className="text-[9px] text-fg-faint">{sub}</div>}
    </div>
  );
}

function InsightCard({ insight, rank }: { insight: Insight; rank: number }) {
  const { icon, color, bg } = severityStyle(insight.severity);
  return (
    <div className={cn("rounded-xl border p-4", color)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bg)}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">
              <span className="text-fg-faint">#{rank} · </span>
              {insight.headline}
            </h3>
            {insight.metric && (
              <span className="num shrink-0 rounded-md bg-bg px-1.5 py-0.5 text-[10px] text-fg-muted">
                {insight.metric}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{insight.body}</p>
          {insight.targetHelp && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-bg/50 px-2 py-1.5">
              <Target size={11} className="mt-0.5 shrink-0 text-primary" />
              <div className="text-[11px] leading-snug text-fg">{insight.targetHelp}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function severityStyle(sev: InsightSeverity): { icon: React.ReactNode; color: string; bg: string } {
  switch (sev) {
    case "critical":
      return {
        icon: <AlertTriangle size={16} className="text-sg-loss" />,
        color: "border-sg-loss/40 bg-sg-loss/5",
        bg: "bg-sg-loss/20",
      };
    case "warning":
      return {
        icon: <TrendingDown size={16} className="text-amber-500" />,
        color: "border-amber-500/40 bg-amber-500/5",
        bg: "bg-amber-500/20",
      };
    case "positive":
      return {
        icon: <CheckCircle2 size={16} className="text-sg-gain" />,
        color: "border-sg-gain/40 bg-sg-gain/5",
        bg: "bg-sg-gain/20",
      };
    default:
      return {
        icon: <Info size={16} className="text-fg-muted" />,
        color: "border-border bg-bg-raised",
        bg: "bg-bg",
      };
  }
}

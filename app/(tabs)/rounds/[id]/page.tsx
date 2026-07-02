"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Plus, Minus, ArrowRight } from "lucide-react";
import {
  getRound,
  getShotsForRound,
  saveShot,
  deleteShot,
  saveRound,
} from "@/lib/storage";
import type { StoredRound, StoredShot, UnforcedErrors } from "@/lib/storage/types";
import type { Lie } from "@/lib/sg/types";
import { scoreShots } from "@/lib/entry/scoreDraft";
import { ParCirclePicker } from "@/components/entry/ParCirclePicker";
import { ScoreStepper } from "@/components/entry/ScoreStepper";
import { ShotTable } from "@/components/entry/ShotTable";
import { UnforcedErrorsList } from "@/components/entry/UnforcedErrorsList";
import { CelebrationCard } from "@/components/entry/CelebrationCard";
import { totalSG } from "@/lib/sg/compute";
import { computeTiger5 } from "@/lib/tiger5";
import { cn, fmtSG, sgColorClass } from "@/lib/utils";

export default function RoundEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roundId = params.id;

  const [round, setRound] = useState<StoredRound | null>(null);
  const [allShots, setAllShots] = useState<StoredShot[]>([]);
  const [hole, setHole] = useState(1);
  const [logShots, setLogShots] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await getRound(roundId);
        if (!r) return;
        setRound(r);
        const shots = await getShotsForRound(roundId);
        setAllShots(shots);
        // Resume where the user left off — last hole they entered anything on
        const lastScoreIdx = (r.holeScores ?? []).reduce(
          (idx, s, i) => (s && s > 0 ? i + 1 : idx),
          0,
        );
        const lastShotHole = shots.length ? shots[shots.length - 1].holeNumber : 0;
        setHole(Math.max(1, Math.min(r.holeCount ?? 18, Math.max(lastScoreIdx, lastShotHole) || 1)));
      } catch (e) {
        console.error("load round failed:", e);
      }
    })();
  }, [roundId]);

  // Running totals for header — hooks must run every render
  const holeCount = round?.holeCount ?? 18;
  const parPerHoleSafe = round?.parPerHole ?? Array(holeCount).fill(4);
  const holeScoresSafe = round?.holeScores ?? Array(holeCount).fill(0);

  const roundScore = useMemo(
    () => holeScoresSafe.slice(0, holeCount).reduce((a, b) => a + (b || 0), 0),
    [holeScoresSafe, holeCount],
  );
  const roundPar = useMemo(
    () =>
      parPerHoleSafe
        .slice(0, holeCount)
        .reduce((acc: number, p: number, i: number) => acc + ((holeScoresSafe[i] ?? 0) > 0 ? p : 0), 0),
    [parPerHoleSafe, holeScoresSafe, holeCount],
  );
  const roundToPar = roundScore - roundPar;

  if (!round) return <div className="p-6 text-fg-faint">Loading…</div>;

  const parPerHole = parPerHoleSafe;
  const holeScores = holeScoresSafe;
  const errors = round.unforcedErrorsByHole ?? Array(holeCount).fill({});
  const par = (parPerHole[hole - 1] ?? 4) as 3 | 4 | 5;
  const scoreValue = holeScores[hole - 1] || 0;
  const holeShotsRaw = allShots
    .filter((s) => s.holeNumber === hole)
    .sort((a, b) => a.shotNumber - b.shotNumber);
  const scoredShots = scoreShots(holeShotsRaw, parPerHole);
  const holeSGSum = scoredShots.reduce((sum, s) => sum + (s.sg ?? 0), 0);

  // ---------- persistence helpers ----------

  const persistRound = async (patch: Partial<StoredRound>) => {
    const next = { ...round, ...patch, updatedAt: Date.now() };
    setRound(next);
    await saveRound(next);
  };

  const setPar = async (p: 3 | 4 | 5) => {
    const next = [...parPerHole];
    next[hole - 1] = p;
    const confirmed = Array.from(new Set([...(round.parConfirmedHoles ?? []), hole]));
    await persistRound({ parPerHole: next, parConfirmedHoles: confirmed });
  };

  const setScore = async (n: number) => {
    const next = [...holeScores];
    next[hole - 1] = n;
    await persistRound({ holeScores: next });
    // If shot detail is expanded, resize the shot list to match
    if (logShots) await resizeShots(n);
  };

  const setErrors = async (next: UnforcedErrors) => {
    const arr = [...errors];
    arr[hole - 1] = next;
    await persistRound({ unforcedErrorsByHole: arr });
  };

  // Reshape stored shots for this hole to have exactly `count` entries.
  // Preserves existing entries; adds sensible defaults when growing; drops last when shrinking.
  const resizeShots = async (count: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const current = allShots
        .filter((s) => s.holeNumber === hole)
        .sort((a, b) => a.shotNumber - b.shotNumber);
      const nextShots = [...current];

      // Grow
      while (nextShots.length < count) {
        const shotNumber = nextShots.length + 1;
        const prev = nextShots[nextShots.length - 1];
        const startLie: Lie = prev ? prev.endLie : "tee";
        const startDistance = prev ? prev.endDistance : defaultTeeYardage(par);
        nextShots.push({
          id: crypto.randomUUID(),
          holeNumber: hole,
          shotNumber,
          startLie,
          startDistance,
          endLie: "green",
          endDistance: 0,
          penalty: false,
          holed: false,
        });
      }
      // Shrink
      while (nextShots.length > count) {
        const removed = nextShots.pop();
        if (removed) await deleteShot(removed.id);
      }
      // Mark last as holed, others as not
      nextShots.forEach((s, i) => {
        s.holed = i === nextShots.length - 1;
        if (s.holed) {
          s.endDistance = 0;
          s.endLie = "green";
        }
      });

      // Chain start positions
      chainShots(nextShots);

      // Persist all
      for (const s of nextShots) await saveShot(round.id, s);

      // Update local
      setAllShots((prev) => {
        const other = prev.filter((s) => s.holeNumber !== hole);
        return [...other, ...nextShots];
      });
    } finally {
      setBusy(false);
    }
  };

  const updateShotRow = async (rowIndex: number, patch: Partial<StoredShot>) => {
    const holeShots = allShots
      .filter((s) => s.holeNumber === hole)
      .sort((a, b) => a.shotNumber - b.shotNumber);
    const next = holeShots.map((s, i) => (i === rowIndex ? { ...s, ...patch } : { ...s }));
    chainShots(next);
    for (const s of next) await saveShot(round.id, s);
    setAllShots((prev) => {
      const other = prev.filter((s) => s.holeNumber !== hole);
      return [...other, ...next];
    });
  };

  const setTeeYardage = async (yd: number) => {
    const holeShots = allShots
      .filter((s) => s.holeNumber === hole)
      .sort((a, b) => a.shotNumber - b.shotNumber);
    if (holeShots.length === 0) return;
    const next = holeShots.map((s, i) => (i === 0 ? { ...s, startDistance: yd } : { ...s }));
    for (const s of next) await saveShot(round.id, s);
    setAllShots((prev) => {
      const other = prev.filter((s) => s.holeNumber !== hole);
      return [...other, ...next];
    });
  };

  const goToHole = (h: number) => {
    setHole(Math.max(1, Math.min(holeCount, h)));
    setCelebrating(false);
    setLogShots(false);
  };

  const finishRound = async () => {
    try {
      const shots = await getShotsForRound(round.id);
      const scored = scoreShots(shots, parPerHole);
      const sg = totalSG(
        scored.map((s) => ({
          startLie: s.startLie,
          startDistance: s.startDistance,
          endLie: s.endLie,
          endDistance: s.endDistance,
          holed: s.holed,
          penalty: s.penalty,
          par: (parPerHole[s.holeNumber - 1] ?? 4) as 3 | 4 | 5,
        })),
      );
      const totalScore = holeScores.slice(0, holeCount).reduce((a, b) => a + (b || 0), 0);
      const tiger5 = computeTiger5(round, scored);
      const updated: StoredRound = {
        ...round,
        status: "complete",
        totalScore,
        sgTotal: sg.total,
        sgOTT: sg.ott,
        sgAPP: sg.app,
        sgARG: sg.arg,
        sgPUTT: sg.putt,
        tiger5,
      };
      await saveRound(updated);
      router.push(`/rounds/${round.id}/summary`);
    } catch (e) {
      console.error("finishRound failed:", e);
      alert("Finish failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const teeYardage = holeShotsRaw[0]?.startDistance ?? 0;
  const isLastHole = hole >= holeCount;

  // Log-shots toggle behavior — creating shots when turned on
  const toggleLogShots = async () => {
    if (!logShots && scoreValue > 0 && holeShotsRaw.length === 0) {
      // Materialize shots to match current score
      await resizeShots(scoreValue);
    }
    setLogShots((v) => !v);
  };

  // Celebration view (shown after Next/Finish button on a hole with a score)
  if (celebrating && scoreValue > 0) {
    return (
      <div className="flex h-[100dvh] flex-col">
        <TopBar
          hole={hole}
          holeCount={holeCount}
          roundScore={roundScore}
          roundToPar={roundToPar}
          onPrev={() => goToHole(hole - 1)}
          onNext={() => goToHole(hole + 1)}
        />
        <div className="flex-1">
          <CelebrationCard
            hole={hole}
            par={par}
            score={scoreValue}
            sg={holeSGSum}
            isLastHole={isLastHole}
            onNextHole={() => goToHole(hole + 1)}
            onFinish={finishRound}
            onUndo={() => setCelebrating(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar
        hole={hole}
        holeCount={holeCount}
        roundScore={roundScore}
        roundToPar={roundToPar}
        onPrev={() => goToHole(hole - 1)}
        onNext={() => goToHole(hole + 1)}
      />

      <div className="flex-1 space-y-6 px-4 pt-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Hole #{hole}</h1>
          <p className="mt-1 text-sm text-fg-faint">is a par</p>
        </div>

        {/* Par picker */}
        <ParCirclePicker value={par} onPick={setPar} />

        {/* Score */}
        <div className="space-y-3">
          <p className="text-center text-sm text-fg-muted">What was your score?</p>
          <ScoreStepper
            value={scoreValue || par}
            onChange={setScore}
            min={1}
            max={15}
          />
          {scoreValue > 0 && (
            <p className={cn("num text-center text-xs", sgColorClass(par - scoreValue))}>
              {scoreValue < par
                ? `${par - scoreValue} under par`
                : scoreValue === par
                  ? "even par"
                  : `${scoreValue - par} over par`}
            </p>
          )}
        </div>

        {/* Shot detail (optional) */}
        <div>
          <button
            type="button"
            onClick={toggleLogShots}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm",
              logShots
                ? "border-primary/60 bg-primary/10 text-fg"
                : "border-border bg-bg-raised text-fg-muted",
            )}
          >
            <span className="flex items-center gap-2">
              {logShots ? <Minus size={14} /> : <Plus size={14} />}
              {logShots ? "Hide shot detail" : "Log shots for Strokes Gained"}
            </span>
            {holeShotsRaw.length > 0 && (
              <span className={cn("num text-xs", sgColorClass(holeSGSum))}>
                SG {fmtSG(holeSGSum, 1)}
              </span>
            )}
          </button>

          {logShots && scoreValue > 0 && (
            <div className="mt-3 space-y-3">
              <ShotTable
                teeYardage={teeYardage || defaultTeeYardage(par)}
                onTeeYardageChange={setTeeYardage}
                shots={holeShotsRaw}
                onRowLieChange={(i, lie) => updateShotRow(i, { endLie: lie })}
                onRowDistanceChange={(i, d) => updateShotRow(i, { endDistance: d })}
              />
            </div>
          )}
          {logShots && scoreValue === 0 && (
            <p className="mt-3 text-center text-xs text-fg-faint">Set your score first.</p>
          )}
        </div>

        {/* Unforced errors */}
        {scoreValue > 0 && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Unforced errors</h2>
              <span className="text-[10px] uppercase tracking-wide text-fg-faint">tap to flag</span>
            </div>
            <UnforcedErrorsList value={errors[hole - 1] ?? {}} par={par} onChange={setErrors} />
          </div>
        )}

        {/* CTA */}
        <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border bg-bg/95 px-4 py-3 pb-safe backdrop-blur">
          <button
            type="button"
            onClick={() => {
              if (scoreValue === 0) return;
              setCelebrating(true);
            }}
            disabled={scoreValue === 0}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold tracking-wide transition-colors",
              scoreValue === 0
                ? "bg-bg-muted text-fg-faint"
                : "bg-primary text-white active:bg-primary-hover",
            )}
          >
            {isLastHole ? "Finish round" : "Next hole"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function chainShots(shots: StoredShot[]) {
  for (let i = 0; i < shots.length; i++) {
    if (i === 0) continue;
    const prev = shots[i - 1];
    shots[i].startLie = prev.endLie;
    shots[i].startDistance = prev.endDistance;
  }
}

function defaultTeeYardage(par: 3 | 4 | 5): number {
  return par === 3 ? 160 : par === 4 ? 400 : 540;
}

// ---------- top bar ----------

function TopBar({
  hole, holeCount, roundScore, roundToPar, onPrev, onNext,
}: {
  hole: number; holeCount: number; roundScore: number; roundToPar: number;
  onPrev: () => void; onNext: () => void;
}) {
  const toParStr =
    roundScore === 0 ? "" : roundToPar > 0 ? `+${roundToPar}` : roundToPar === 0 ? "E" : String(roundToPar);
  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link href="/rounds" className="p-1 text-fg-muted"><X size={20} /></Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={hole <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted disabled:text-fg-faint"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="num text-center text-xs text-fg-muted">
            <div className="text-[10px] uppercase tracking-wide text-fg-faint">Hole</div>
            <div className="text-sm text-fg">{hole} / {holeCount}</div>
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={hole >= holeCount}
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted disabled:text-fg-faint"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="text-right text-xs">
          <div className="text-[10px] uppercase tracking-wide text-fg-faint">Round</div>
          <div className="num">
            <span className="text-fg">{roundScore || "—"}</span>{" "}
            <span className={cn(sgColorClass(-roundToPar))}>{toParStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

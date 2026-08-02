"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { getGame } from "@/lib/practice/games";
import { getGameSessionsForGame, saveGameSession, deleteGameSession } from "@/lib/storage";
import type { GameSession } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const game = getGame(gameId);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [stationScores, setStationScores] = useState<Record<string, number>>({});
  const [flatScore, setFlatScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const refresh = () => getGameSessionsForGame(gameId).then(setSessions);
  useEffect(() => { refresh(); }, [gameId]);

  const hasStations = !!game?.stations?.length;
  const totalFromStations = useMemo(
    () => Object.values(stationScores).reduce((a, b) => a + (b || 0), 0),
    [stationScores],
  );
  const score = hasStations ? totalFromStations : flatScore;

  if (!game) {
    return (
      <div className="p-6">
        <Link href="/practice" className="text-fg-muted">← Practice</Link>
        <div className="mt-4 text-sg-loss">Game not found.</div>
      </div>
    );
  }

  const setStation = (key: string, val: number, max: number) => {
    setStationScores((prev) => ({ ...prev, [key]: Math.max(0, Math.min(max, val)) }));
  };

  const save = async () => {
    setSaving(true);
    const session: GameSession = {
      id: crypto.randomUUID(),
      gameId: game.id,
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      score,
      maxPoints: game.maxPoints,
      stationScores: hasStations ? stationScores : undefined,
    };
    await saveGameSession(session);
    setStationScores({});
    setFlatScore(0);
    await refresh();
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    await deleteGameSession(id);
    await refresh();
  };

  const higherIsBetter = game.higherIsBetter !== false;
  const best = sessions.length
    ? (higherIsBetter
        ? Math.max(...sessions.map((s) => s.score))
        : Math.min(...sessions.map((s) => s.score)))
    : null;
  const avg = sessions.length
    ? sessions.reduce((a, s) => a + s.score, 0) / sessions.length
    : null;

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <button onClick={() => router.push("/practice")} className="p-1 text-fg-muted">
            <ArrowLeft size={18} />
          </button>
          {game.source && (
            <span className="rounded bg-bg-raised px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-faint">
              {game.source}
            </span>
          )}
        </div>
        <h1 className="text-lg font-semibold">{game.name}</h1>
        <p className="mt-0.5 text-xs text-fg-muted">{game.tagline}</p>
      </div>

      {/* Stats bar */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
          <MiniStat label="Best" v={best!} />
          <MiniStat label="Avg" v={avg!.toFixed(1)} />
          <MiniStat label="Target" v={game.targetPoints} />
        </div>
      )}

      {/* Rules */}
      <div className="border-b border-border px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-fg-faint">How to play</div>
        <p className="text-xs leading-relaxed text-fg-muted">{game.description}</p>
        <div className="mt-2 rounded-md bg-bg-raised px-2 py-1.5 text-[11px] text-fg">
          <span className="text-fg-faint">Scoring: </span>{game.howToScore}
        </div>
      </div>

      {/* Trend chart */}
      {sessions.length >= 2 && (
        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-fg-faint">Trend</div>
          <TrendChart
            sessions={[...sessions].reverse()}
            maxPoints={game.maxPoints}
            target={game.targetPoints}
            higherIsBetter={higherIsBetter}
          />
        </div>
      )}

      {/* Score entry */}
      <div className="px-4 py-4">
        <div className="mb-3 text-[10px] uppercase tracking-wide text-fg-faint">Log a session</div>

        {hasStations ? (
          <div className="space-y-2">
            {game.stations!.map((st) => (
              <div
                key={st.key}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-raised px-3 py-2"
              >
                <div>
                  <div className="text-sm text-fg">{st.label}</div>
                  <div className="text-[10px] text-fg-faint">out of {st.maxPer}</div>
                </div>
                <Stepper
                  value={stationScores[st.key] ?? 0}
                  max={st.maxPer}
                  onChange={(v) => setStation(st.key, v, st.maxPer)}
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-bg-muted px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-fg-faint">Total</span>
              <span className="num text-lg font-semibold">{score} / {game.maxPoints}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-raised px-3 py-3">
            <div>
              <div className="text-sm text-fg">Your score</div>
              <div className="text-[10px] text-fg-faint">
                {higherIsBetter ? "max" : "par"} {game.maxPoints}
              </div>
            </div>
            <Stepper value={flatScore} max={game.maxPoints} onChange={setFlatScore} />
          </div>
        )}
      </div>

      {/* History */}
      {sessions.length > 0 && (
        <div className="px-4">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-fg-faint">History</div>
          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-raised px-3 py-2"
              >
                <div className="text-xs text-fg-muted">{s.date}</div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "num text-sm font-medium",
                      (higherIsBetter ? s.score >= game.targetPoints : s.score <= game.targetPoints)
                        ? "text-sg-gain"
                        : "text-fg",
                    )}
                  >
                    {s.score}
                    <span className="text-fg-faint"> / {s.maxPoints}</span>
                  </span>
                  <button onClick={() => remove(s.id)} className="p-1 text-fg-faint active:text-sg-loss">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-border bg-bg/95 px-4 py-3 pb-safe backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving || score === 0}
          className={cn(
            "w-full rounded-xl py-3.5 text-base font-semibold tracking-wide",
            saving || score === 0
              ? "bg-bg-muted text-fg-faint"
              : "bg-primary text-white active:bg-primary-hover",
          )}
        >
          {saving ? "Saving…" : `Save session · ${score}/${game.maxPoints}`}
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, v }: { label: string; v: string | number }) {
  return (
    <div className="bg-bg px-3 py-2 text-center">
      <div className="text-[9px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className="num text-base font-medium">{v}</div>
    </div>
  );
}

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg disabled:text-fg-faint"
      >
        <Minus size={16} />
      </button>
      <div className="num w-10 text-center text-xl font-semibold">{value}</div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg disabled:text-fg-faint"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function TrendChart({
  sessions, maxPoints, target, higherIsBetter,
}: {
  sessions: GameSession[]; maxPoints: number; target: number; higherIsBetter: boolean;
}) {
  const W = 320, H = 90, pad = 6;
  const n = sessions.length;
  const xAt = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - 2 * pad);
  const yAt = (v: number) => H - pad - (v / maxPoints) * (H - 2 * pad);

  const pts = sessions.map((s, i) => `${xAt(i)},${yAt(s.score)}`).join(" ");
  const targetY = yAt(target);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {/* Target line */}
      <line x1={pad} y1={targetY} x2={W - pad} y2={targetY} stroke="#666" strokeWidth="0.75" strokeDasharray="3 3" />
      <text x={W - pad} y={targetY - 3} fontSize="7" fill="#666" textAnchor="end">target {target}</text>
      {/* Trend line */}
      <polyline points={pts} fill="none" stroke="#e0508c" strokeWidth="1.75" />
      {/* Dots */}
      {sessions.map((s, i) => {
        const good = higherIsBetter ? s.score >= target : s.score <= target;
        return (
          <circle key={s.id} cx={xAt(i)} cy={yAt(s.score)} r="2.5" fill={good ? "#22c55e" : "#e0508c"} />
        );
      })}
    </svg>
  );
}

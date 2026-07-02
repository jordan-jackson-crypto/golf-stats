"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveRound, listCourses, upsertCourse } from "@/lib/storage";
import type { StoredRound, StoredCourse } from "@/lib/storage/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function NewRoundPage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [totalPar, setTotalPar] = useState(72);
  const [rating, setRating] = useState<string>("");
  const [slope, setSlope] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedCourses, setSavedCourses] = useState<StoredCourse[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);

  useEffect(() => {
    listCourses().then(setSavedCourses);
  }, []);

  const pickCourse = (c: StoredCourse) => {
    setCourseName(c.name);
    setTotalPar(c.defaultPar);
    setRating(c.rating != null ? String(c.rating) : "");
    setSlope(c.slope != null ? String(c.slope) : "");
    setSelectedCourseName(c.name);
  };

  const start = async () => {
    if (!courseName.trim() || saving) return;
    setSaving(true);
    const id = crypto.randomUUID();
    const ratingNum = rating ? parseFloat(rating) : undefined;
    const slopeNum = slope ? parseInt(slope, 10) : undefined;

    // Upsert the course so it's available next round
    await upsertCourse({
      name: courseName.trim(),
      rating: ratingNum,
      slope: slopeNum,
      defaultPar: totalPar,
      lastUsedAt: Date.now(),
    });

    const round: StoredRound = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      date,
      courseName: courseName.trim(),
      holeCount,
      totalPar,
      courseRating: ratingNum,
      courseSlope: slopeNum,
      parPerHole: Array.from({ length: holeCount }, () => 4),
      parConfirmedHoles: [],
      status: "draft",
    };
    await saveRound(round);
    router.push(`/rounds/${id}`);
  };

  // Filter saved courses by typed name (case-insensitive substring)
  const filteredCourses = courseName.trim()
    ? savedCourses.filter((c) =>
        c.name.toLowerCase().includes(courseName.trim().toLowerCase()) &&
        c.name.toLowerCase() !== courseName.trim().toLowerCase()
      )
    : savedCourses;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">New round</h1>

      <div className="space-y-4">
        <Field label="Course">
          <input
            value={courseName}
            onChange={(e) => {
              setCourseName(e.target.value);
              setSelectedCourseName(null);
            }}
            placeholder="e.g. Winged Foot West"
            className="w-full rounded-lg border border-border bg-bg-raised px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-border-strong focus:outline-none"
            autoFocus
          />
          {filteredCourses.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-fg-faint">
                {courseName.trim() ? "Matches" : "Recent"}
              </div>
              <ul className="space-y-1">
                {filteredCourses.slice(0, 5).map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => pickCourse(c)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                        selectedCourseName === c.name
                          ? "border-fg bg-bg-muted text-fg"
                          : "border-border bg-bg-raised text-fg-muted active:bg-bg-muted",
                      )}
                    >
                      <div>
                        <div className="text-fg">{c.name}</div>
                        <div className="text-[10px] text-fg-faint">
                          Par {c.defaultPar}
                          {c.rating != null && ` · ${c.rating}`}
                          {c.slope != null && ` / ${c.slope}`}
                        </div>
                      </div>
                      {selectedCourseName === c.name && <Check size={14} className="text-fg" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-raised px-3 py-2.5 text-base text-fg focus:border-border-strong focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Holes">
            <div className="grid grid-cols-2 gap-1.5">
              {[9, 18].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setHoleCount(n as 9 | 18);
                    setTotalPar(n === 9 ? 36 : 72);
                  }}
                  className={cn(
                    "num rounded-lg border py-2.5 text-base font-medium",
                    holeCount === n ? "border-fg bg-fg text-bg" : "border-border bg-bg-raised text-fg-muted",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Total par">
            <input
              type="number"
              inputMode="numeric"
              value={totalPar}
              onChange={(e) => setTotalPar(parseInt(e.target.value || String(holeCount === 9 ? 36 : 72), 10))}
              className="num w-full rounded-lg border border-border bg-bg-raised px-3 py-2.5 text-base text-fg focus:border-border-strong focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rating (optional)">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="71.4"
              className="num w-full rounded-lg border border-border bg-bg-raised px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-border-strong focus:outline-none"
            />
          </Field>
          <Field label="Slope (optional)">
            <input
              type="number"
              inputMode="numeric"
              value={slope}
              onChange={(e) => setSlope(e.target.value)}
              placeholder="125"
              className="num w-full rounded-lg border border-border bg-bg-raised px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-border-strong focus:outline-none"
            />
          </Field>
        </div>

        <p className="text-[11px] text-fg-faint">
          Course details are saved and auto-filled next time.
          Set par 3 / 4 / 5 per hole on the entry screen — one tap.
        </p>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!courseName.trim() || saving}
        className={cn(
          "mt-6 w-full rounded-lg py-3 text-base font-semibold uppercase tracking-wide",
          !courseName.trim() || saving
            ? "bg-bg-muted text-fg-faint"
            : "bg-fg text-bg active:bg-fg-muted",
        )}
      >
        Start round
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-fg-faint">{label}</label>
      {children}
    </div>
  );
}

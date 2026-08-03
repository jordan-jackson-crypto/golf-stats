"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";
import { CHECKLIST } from "@/lib/practice/checklist";
import { cn } from "@/lib/utils";

const STORE_KEY = "golf-stats-checklist";

export default function ChecklistPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = (next: Record<string, boolean>) => {
    setChecked(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggle = (id: string) => persist({ ...checked, [id]: !checked[id] });
  const reset = () => persist({});

  const allItems = CHECKLIST.flatMap((s) => s.items);
  const doneCount = allItems.filter((i) => checked[i.id]).length;
  const pct = Math.round((doneCount / allItems.length) * 100);

  return (
    <div className="min-h-[100dvh] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/practice")} className="flex items-center gap-1 text-fg-muted">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-semibold">Practice Checklist</h1>
          <button onClick={reset} className="flex items-center gap-1 text-[11px] text-fg-muted">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        {/* Progress */}
        <div className="mt-2">
          <div className="mb-1 flex items-baseline justify-between text-[10px] text-fg-faint">
            <span className="uppercase tracking-wide">Session progress</span>
            <span className="num">{doneCount}/{allItems.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5 px-4 pt-4">
        {CHECKLIST.map((section) => {
          const sectionDone = section.items.filter((i) => checked[i.id]).length;
          return (
            <div key={section.id}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{section.title}</h2>
                <span className="num text-[10px] text-fg-faint">{sectionDone}/{section.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const on = !!checked[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        on ? "border-sg-gain/40 bg-sg-gain/5" : "border-border bg-bg-raised",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-sg-gain bg-sg-gain text-white" : "border-border",
                        )}
                      >
                        {on && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="flex-1">
                        <span className={cn("block text-sm", on ? "text-fg-muted line-through" : "text-fg")}>
                          {item.label}
                        </span>
                        {item.detail && (
                          <span className="mt-0.5 block text-[11px] text-fg-faint">{item.detail}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

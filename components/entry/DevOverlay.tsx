"use client";

import { cn } from "@/lib/utils";

interface Props {
  visible: boolean;
  shotsEntered: number;
  totalTaps: number;
  totalSeconds: number;
}

/**
 * Dev-mode overlay showing seconds-per-shot and taps-per-shot for the
 * current entry session. Targets: < 8s / < 6 taps per shot on average.
 */
export function DevOverlay({ visible, shotsEntered, totalTaps, totalSeconds }: Props) {
  if (!visible) return null;
  const sPerShot = shotsEntered > 0 ? totalSeconds / shotsEntered : 0;
  const tPerShot = shotsEntered > 0 ? totalTaps / shotsEntered : 0;
  const secOK = sPerShot > 0 && sPerShot < 8;
  const tapOK = tPerShot > 0 && tPerShot < 6;

  return (
    <div className="pointer-events-none fixed left-2 top-2 z-50 rounded-md border border-border bg-bg/90 px-2 py-1 font-mono text-[10px] leading-tight text-fg-muted backdrop-blur">
      <div>shots {shotsEntered}</div>
      <div className={cn("num", secOK ? "text-sg-gain" : shotsEntered > 0 ? "text-sg-loss" : "")}>
        {sPerShot.toFixed(1)}s/shot
      </div>
      <div className={cn("num", tapOK ? "text-sg-gain" : shotsEntered > 0 ? "text-sg-loss" : "")}>
        {tPerShot.toFixed(1)}t/shot
      </div>
    </div>
  );
}

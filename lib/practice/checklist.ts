/**
 * Practice checklist template. A repeatable session plan weighted toward what
 * the user values: technical work + games. Edit freely — it's just data.
 *
 * Check state persists in localStorage so you can build a session, work
 * through it, and reset for the next one.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export const CHECKLIST: ChecklistSection[] = [
  {
    id: "technical",
    title: "Technical work",
    items: [
      { id: "tech-lowpoint", label: "Low-point control", detail: "Towel/line drill — strike ball then ground ahead" },
      { id: "tech-face", label: "Face & path", detail: "Start-line gate; confirm face-to-path window" },
      { id: "tech-pivot", label: "Pivot / delivery", detail: "Rehearse the feel you're working on, slow → speed" },
      { id: "tech-video", label: "Film 2-3 swings", detail: "Check against your reference positions" },
    ],
  },
  {
    id: "ball-striking",
    title: "Ball striking",
    items: [
      { id: "bs-9shot", label: "9-shot game (8i-4i)" },
      { id: "bs-driver", label: "Driver game" },
      { id: "bs-wedge", label: "Wedge game (50-150y)" },
    ],
  },
  {
    id: "short-game",
    title: "Short game",
    items: [
      { id: "sg-points", label: "Short game SG points" },
      { id: "sg-updown", label: "Up & down par-18" },
    ],
  },
  {
    id: "putting",
    title: "Putting",
    items: [
      { id: "pt-clock", label: "Clock drill (3-6-9)" },
      { id: "pt-lag", label: "High-side lag" },
    ],
  },
  {
    id: "course-transfer",
    title: "Take it to the course",
    items: [
      { id: "ct-preshot", label: "Pre-shot routine on every ball", detail: "Same commit → look → go you'll use on the course" },
      { id: "ct-target", label: "Pick a specific target every shot", detail: "No aimless range balls" },
      { id: "ct-shotcard", label: "Play a 9-hole 'worst-ball' or target game", detail: "Force scoring pressure" },
    ],
  },
];

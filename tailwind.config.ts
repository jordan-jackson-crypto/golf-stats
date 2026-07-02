import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // DataGolf-inspired dark palette. High-contrast, near-monochrome.
        bg: {
          DEFAULT: "#0a0a0a",
          raised: "#141414",
          muted: "#1a1a1a",
        },
        border: {
          DEFAULT: "#262626",
          strong: "#333333",
        },
        fg: {
          DEFAULT: "#e5e5e5",
          muted: "#a3a3a3",
          faint: "#666666",
        },
        // SG-colored accents: green = gaining, red = losing
        sg: {
          gain: "#22c55e",
          loss: "#ef4444",
          neutral: "#a3a3a3",
        },
        accent: "#60a5fa",
        primary: "#e0508c", // warm magenta CTA, Airbnb-inspired
        "primary-hover": "#c9427a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;

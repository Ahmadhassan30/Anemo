/*
 * Purpose: TailwindCSS configuration — LectureOS terminal + apple UI.
 * Palette is the default Tailwind zinc/indigo/green/yellow/red scales (used
 * directly in classNames per the design system); we only set the font stacks
 * and a couple of keyframes.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in",
      },
    },
  },
  plugins: [],
};

export default config;

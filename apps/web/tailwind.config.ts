/*
 * Purpose: TailwindCSS configuration — Anemo "Apple-minimal" design system.
 * Clean light surfaces, SF-style type, a single blue accent, generous radii and
 * soft shadows. A dedicated `term-*` palette powers the dark live-logs terminal.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light app surfaces
        canvas: "#fbfbfd",
        surface: "#ffffff",
        ink: "#1d1d1f",
        subtle: "#6e6e73",
        faint: "#86868b",
        line: "#e5e5ea",
        "line-strong": "#d2d2d7",
        fill: "#f5f5f7",
        accent: "#0071e3",
        "accent-hover": "#0077ed",
        positive: "#34c759",
        warning: "#ff9f0a",
        danger: "#ff3b30",
        // Dark terminal palette
        term: {
          bg: "#0b0c0e",
          panel: "#141518",
          line: "#26272b",
          fg: "#e6e6e6",
          muted: "#8e8e93",
          green: "#30d158",
          amber: "#ffd60a",
          red: "#ff453a",
          blue: "#0a84ff",
          purple: "#bf5af2",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text",
          "Inter", "Segoe UI", "system-ui", "Helvetica Neue", "Arial", "sans-serif",
        ],
        mono: [
          "SF Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Cascadia Code",
          "JetBrains Mono", "Consolas", "monospace",
        ],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        sm: "0 2px 8px rgba(0,0,0,0.05)",
        DEFAULT: "0 4px 20px rgba(0,0,0,0.06)",
        lg: "0 14px 44px rgba(0,0,0,0.09)",
        glow: "0 0 0 4px rgba(0,113,227,0.12)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        "caret-blink": { "0%,70%,100%": { opacity: "1" }, "20%,50%": { opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
        blink: "blink 1.05s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

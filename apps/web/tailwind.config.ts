/*
 * Purpose: TailwindCSS configuration — LectureOS terminal design system.
 * Semantic tokens (background/card/primary/border…) map to the terminal
 * palette so existing token-based components inherit the theme; a `term`
 * namespace exposes the raw palette for bespoke styling.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0e12",
        foreground: "#c8d3da",
        card: "#0f141a",
        "card-foreground": "#c8d3da",
        popover: "#0f141a",
        "popover-foreground": "#c8d3da",
        primary: "#4ee39a",
        "primary-foreground": "#04110a",
        secondary: "#11171e",
        "secondary-foreground": "#c8d3da",
        muted: "#11171e",
        "muted-foreground": "#6b7a85",
        accent: "#46d4e0",
        "accent-foreground": "#04110a",
        destructive: "#ff6b6b",
        "destructive-foreground": "#0a0e12",
        border: "#1e2730",
        input: "#1e2730",
        ring: "#4ee39a",
        // Raw terminal palette
        term: {
          bg: "#0a0e12",
          panel: "#0f141a",
          line: "#1e2730",
          ink: "#c8d3da",
          dim: "#6b7a85",
          green: "#4ee39a",
          cyan: "#46d4e0",
          amber: "#e8b84b",
          red: "#ff6b6b",
          violet: "#b98cff",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "2px",
        md: "3px",
        lg: "4px",
        xl: "6px",
        "2xl": "8px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(78,227,154,0.25), 0 0 28px -10px rgba(78,227,154,0.45)",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        blink: "blink 1.05s steps(1) infinite",
        scan: "scan 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Supaste (inspomcp.dev/screens/supaste-com) — Marquee Hero, light glassmorphism */
        supaste: {
          dominant: "#087cf8",
          surface: "#8ad8fc",
          ink: "#0a508f",
          accent: "#ac6853",
          detail: "#b5bcc6",
        },
        obsidian: {
          950: "#05070a",
          900: "#090d14",
          850: "#0e131d",
          800: "#141b27",
          700: "#1e293b",
          600: "#334155",
        },
        electric: {
          cyan: "#00f0ff",
          blue: "#2d7ff9",
          emerald: "#00e676",
          amber: "#ffab00",
          crimson: "#ff3366",
        },
        steel: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter Display", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        floating: "0 24px 80px -20px rgba(8, 124, 248, 0.45), 0 8px 24px -8px rgba(10, 80, 143, 0.25)",
        glass: "0 8px 32px -8px rgba(10, 80, 143, 0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
        terminal: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        "terminal-light": "0 0 0 1px rgba(0, 0, 0, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.1)",
        glow: "0 0 30px -5px rgba(0, 240, 255, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

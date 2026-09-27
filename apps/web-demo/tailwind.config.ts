import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* SYNCLIUM — THE BORDERLESS INVOICE
           ink: almost-black field · paper: warm off-white document/data
           signal: electric orange = transit / clearance / movement
           protocol: restrained cyan = machine state / system
           rule: hairline borders */
        ink: {
          950: "#07090C",
          900: "#0B0E13",
          850: "#10141B",
          800: "#161B23",
          700: "#1C2128",
          600: "#2A313B",
        },
        paper: {
          DEFAULT: "#F2EDE3",
          dim: "#CFC7B8",
          faint: "#A29B8A",
        },
        signal: {
          DEFAULT: "#FF5C00",
          hot: "#FF7A29",
          deep: "#B23E00",
        },
        protocol: {
          DEFAULT: "#3DD6C2",
          dim: "#1E8A7E",
          faint: "#123B37",
        },
        /* legacy aliases retained for /console + /docs routes */
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
        /* Editorial voice: high-contrast serif, never a geometric sans */
        editorial: ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
        sans: ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
        /* Technical voice: monospace telemetry */
        mono: ["'IBM Plex Mono'", "ui-monospace", "'Cascadia Code'", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

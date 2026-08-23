import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#1e293b",
          800: "#0f172a",
          900: "#0b1120",
          950: "#060913",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          emerald: "#10b981",
          violet: "#8b5cf6",
          cyan: "#06b6d4",
          amber: "#f59e0b",
        },
      },
      boxShadow: {
        glass: "0 20px 50px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "glass-light": "0 20px 50px -10px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.06)",
        float: "0 25px 50px -12px rgba(14, 165, 233, 0.25)",
        "glow-cyan": "0 0 35px -5px rgba(6, 182, 212, 0.35)",
        "glow-brand": "0 0 40px -5px rgba(59, 130, 246, 0.35)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 8s ease-in-out 2s infinite",
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

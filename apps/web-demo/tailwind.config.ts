import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1020",
          900: "#0f1526",
          800: "#161e33",
          700: "#202a45",
        },
        brand: {
          300: "#8fd3ff",
          400: "#5cb8ff",
          500: "#2f96ff",
          600: "#1a7ae5",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

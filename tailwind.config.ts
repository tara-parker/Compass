import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b1020",
          soft: "#151b2e",
          line: "#232b45",
        },
        brand: {
          DEFAULT: "#5b8cff",
          soft: "#8fb0ff",
        },
        up: "#22c55e",
        down: "#ef4444",
        flat: "#94a3b8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

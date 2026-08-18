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
          DEFAULT: "#090c15",
          soft: "#111726",
          line: "#1e2740",
        },
        brand: {
          DEFAULT: "#6d8fe8",
          soft: "#9db4f0",
        },
        up: "#4ade80",
        down: "#f2777a",
        flat: "#7c8aa5",
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

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: {
          DEFAULT: "#0f141f",
          hover: "#171f2f",
          border: "#1e293b",
        },
        terminal: {
          green: "#00e676",
          red: "#ff1744",
          cyan: "#00e5ff",
          amber: "#ffab00",
          purple: "#7c4dff",
          dim: "#64748b",
        }
      },
      fontFamily: {
        mono: ["Consolas", "Courier New", "ui-monospace", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
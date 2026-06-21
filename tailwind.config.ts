import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      colors: {
        ink: "#0A1323",
        slate: "#5F6F82",
        moss: "#0A1323",
        mint: "#F2EFE7",
        paper: "#FFFDF8",
        clay: "#D65A2E",
        coral: "#E08A7A",
        indigo: "#2D3E57",
        sky: "#F7F1E8",
        line: "#E5DDD0"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(10, 19, 35, 0.10)",
        glow: "0 16px 34px rgba(214, 90, 46, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;

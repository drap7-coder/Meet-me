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
        graphite: "#1A2332",
        card: "#232F42",
        slate: "#5F6F82",
        moss: "#0A1323",
        mint: "#F2EFE7",
        paper: "#FFFDF8",
        clay: "#34C759",
        coral: "#E07A5F",
        indigo: "#2D3E57",
        sky: "#F7F1E8",
        line: "#E5DDD0",
        koi: "#34C759",
        "koi-hover": "#2A9D47",
        watch: "#0A84FF",
        events: "#E07A5F",
        food: "#F5A623",
        drinks: "#F59E0B",
        outdoor: "#14B8A6",
        muted: "#8B95A8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(10, 19, 35, 0.10)",
        glow: "0 16px 40px rgba(52, 199, 89, 0.18)",
        card: "0 8px 32px rgba(0, 0, 0, 0.22)"
      },
      borderRadius: {
        card: "18px",
        pill: "999px"
      }
    }
  },
  plugins: []
};

export default config;

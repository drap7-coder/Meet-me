import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        slate: "#6E6E73",
        moss: "#111111",
        mint: "#F5F5F7",
        paper: "#FFFFFF",
        clay: "#0071E3",
        sky: "#F5F5F7",
        line: "#E5E5EA"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(0, 0, 0, 0.08)",
        glow: "0 22px 80px rgba(0, 113, 227, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;

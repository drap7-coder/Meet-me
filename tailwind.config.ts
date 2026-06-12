import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12324A",
        slate: "#6B7280",
        moss: "#12324A",
        mint: "#F8FAFC",
        paper: "#FFFFFF",
        clay: "#FF6B6B",
        coral: "#FF6B6B",
        indigo: "#4F46E5",
        sky: "#F8FAFC",
        line: "#E5E7EB"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 24, 39, 0.08)",
        glow: "0 16px 34px rgba(255, 107, 107, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;

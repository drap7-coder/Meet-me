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
        slate: "#6F6F6F",
        moss: "#111111",
        mint: "#FFFFFF",
        paper: "#FFFFFF",
        clay: "#1F5EFF",
        sky: "#F5F6FA",
        line: "#E5E7EB"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 17, 17, 0.08)",
        glow: "0 16px 34px rgba(31, 94, 255, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;

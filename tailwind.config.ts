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
        paper: "#F3EEE5",
        clay: "#1F5EFF",
        sky: "#EBE3D6",
        line: "#DED5C8"
      },
      boxShadow: {
        soft: "0 16px 44px rgba(17, 17, 17, 0.08)",
        glow: "0 14px 34px rgba(31, 94, 255, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;

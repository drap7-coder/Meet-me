import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        moss: "#315846",
        mint: "#dff3e6",
        paper: "#fbfaf6",
        clay: "#c96f4a",
        sky: "#dcecf5"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 33, 28, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

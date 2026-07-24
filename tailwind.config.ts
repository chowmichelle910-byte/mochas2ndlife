import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        food: "#f59e0b",
        water: "#3b82f6",
        pee: "#eab308",
        poop: "#92400e",
      },
    },
  },
  plugins: [],
};

export default config;

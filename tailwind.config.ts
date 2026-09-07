import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orly: {
          cream: "#F7F1E8",
          paper: "#FFFBF5",
          sand: "#E8DCC8",
          ink: "#2C241C",
          muted: "#7A6F63",
          gold: "#B8893D",
          toast: "#8B5E2B",
          charcoal: "#1A1511",
          line: "#E5D9C8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(44, 36, 28, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;

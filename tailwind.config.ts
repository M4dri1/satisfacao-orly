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
          cream: "#F4EFE6",
          paper: "#FBF8F2",
          sand: "#E6DDCC",
          ink: "#2A2F24",
          muted: "#6E7265",
          gold: "#7F9170",
          toast: "#55644A",
          charcoal: "#3D4733",
          line: "#E1D9C9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(42, 47, 36, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#07111f",
        panel: "#0d1728",
        "panel-strong": "#101d32",
        line: "#1f2f4a",
        glow: "#6ee7f9",
        accent: "#39d98a",
        amber: "#f8b84e",
        rose: "#ff7d96",
        text: "#f3f7ff",
        muted: "#8fa6c7",
      },
      boxShadow: {
        premium: "0 24px 80px rgba(2, 8, 20, 0.45)",
        soft: "0 12px 40px rgba(3, 10, 24, 0.25)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
        rise: "rise 0.7s ease forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.04)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

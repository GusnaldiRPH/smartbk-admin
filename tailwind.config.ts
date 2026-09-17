import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F4F8F6",
        ink: "#111827",
        muted: "#6b7c76",
        primary: {
          50: "#F0FAF4",
          100: "#DCEFE4",
          700: "#0e6f4c",
          800: "#0b5a3d",
        },
        accent: {
          100: "#FDECC8",
        },
      },
      keyframes: {
        floatA: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(24px, -28px) scale(1.06)" },
        },
        floatB: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-28px, 26px) scale(1.08)" },
        },
        floatC: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(18px, 22px)" },
        },
      },
      animation: {
        floatA: "floatA 11s ease-in-out infinite",
        floatB: "floatB 14s ease-in-out infinite",
        floatC: "floatC 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#effdf5",
          100: "#d8f8e6",
          200: "#b3f0cf",
          300: "#7de3b0",
          400: "#3ccf8a",
          500: "#17b574",
          600: "#0c9a60",
          700: "#0a7d4e",
          800: "#0b6340",
          900: "#0a5036",
          950: "#032d1e",
        },
        ink: "#0b1f17",
        muted: "#5b6f66",
        surface: "#f2f8f4",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        serif: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      keyframes: {
        floatA: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(40px,-30px) scale(1.1)" },
        },
        floatB: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-40px,30px) scale(1.15)" },
        },
        floatC: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(30px,40px) scale(0.9)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pageIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.95) translateY(12px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        ring: {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        floatA: "floatA 14s ease-in-out infinite",
        floatB: "floatB 17s ease-in-out infinite",
        floatC: "floatC 20s ease-in-out infinite",
        fadeUp: "fadeUp .6s cubic-bezier(.22,1,.36,1) backwards",
        pageIn: "pageIn .45s cubic-bezier(.22,1,.36,1) backwards",
        popIn: "popIn .7s cubic-bezier(.22,1,.36,1) backwards",
        shimmer: "shimmer 1.8s linear infinite",
        gradient: "gradient 12s ease infinite",
        ring: "ring 2.4s ease-out infinite",
        bob: "bob 4s ease-in-out infinite",
        shake: "shake .4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
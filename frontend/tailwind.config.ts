import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          secondary: "#3a3a3a",
          muted: "#6b6b6b",
          faint: "#a3a3a3",
        },
        surface: {
          DEFAULT: "#fcfcfa",
          raised: "#ffffff",
          subtle: "#f5f5f3",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Helvetica Neue",
          "Hiragino Sans",
          "Noto Sans CJK JP",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2rem, 5vw, 4rem)",   { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.5rem, 4vw, 2.5rem)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-in":    "fadeIn 0.6s cubic-bezier(0.22,1,0.36,1)",
        "slide-up":   "slideUp 0.7s cubic-bezier(0.22,1,0.36,1)",
        "scale-in":   "scaleIn 0.5s cubic-bezier(0.22,1,0.36,1)",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(40px)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)",    filter: "blur(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

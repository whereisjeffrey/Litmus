/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#FEFDFB",
          100: "#FBF8F3",
          200: "#F5F0E8",
          300: "#EDE6DA",
          400: "#DDD4C4",
          500: "#C7BBAA",
          600: "#A89A86",
          700: "#857663",
          800: "#5C5144",
          900: "#3A332B",
          950: "#1E1B17",
        },
        accent: {
          50: "#FFF4ED",
          100: "#FFE6D4",
          200: "#FFCCA8",
          300: "#FFAA71",
          400: "#FF7F37",
          500: "#FF5F0F",
          600: "#F04506",
          700: "#C73207",
          800: "#9E290E",
          900: "#7F250F",
          950: "#450F05",
        },
        success: {
          50: "#ECFDF5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        danger: {
          50: "#FEF2F2",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
        warning: {
          50: "#FFFBEB",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        glow: "0 0 20px rgba(255, 95, 15, 0.15)",
      },
      animation: {
        "gauge-fill": "gaugeFill 1s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      keyframes: {
        gaugeFill: {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--gauge-offset)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

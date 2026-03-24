/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#FAFAF8",
          100: "#F5F4F0",
          200: "#ECEAE4",
          300: "#E0DDD6",
          400: "#CCC8BE",
          500: "#B0AAA0",
          600: "#8E877C",
          700: "#6B655C",
          800: "#4A453E",
          900: "#2E2A25",
          950: "#1A1816",
        },
        accent: {
          50: "#FFF7F0",
          100: "#FFEDD9",
          200: "#FFD9B3",
          300: "#FFBE82",
          400: "#FF9F4D",
          500: "#E8772B",
          600: "#C45E1A",
          700: "#9E4A14",
          800: "#7A3B12",
          900: "#5C2C0E",
          950: "#361A08",
        },
        success: {
          50: "#F0FAF4",
          100: "#DBF2E3",
          400: "#5BB98B",
          500: "#3D9E6E",
          600: "#2D7D55",
        },
        danger: {
          50: "#FDF2F0",
          100: "#FAE0DC",
          400: "#E07A6E",
          500: "#D15A4C",
          600: "#B84438",
        },
        warning: {
          50: "#FDF8EE",
          100: "#FAEDD2",
          400: "#DEBA5C",
          500: "#C9A23B",
          600: "#A8852A",
        },
        // Category colors (muted, warm)
        cat: {
          accessibility: "#7BA3C4",
          ux: "#9B82B8",
          forms: "#6BA8A0",
          content: "#C4A04E",
          visual: "#C48A9A",
          performance: "#8893A6",
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
        soft: "0 1px 3px 0 rgba(46, 42, 37, 0.06), 0 1px 2px -1px rgba(46, 42, 37, 0.04)",
        card: "0 2px 8px 0 rgba(46, 42, 37, 0.06), 0 1px 3px -1px rgba(46, 42, 37, 0.04)",
        glow: "0 0 20px rgba(232, 119, 43, 0.12)",
      },
      animation: {
        "gauge-fill": "gaugeFill 1.2s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        gaugeFill: {
          "0%": { strokeDashoffset: "var(--gauge-circumference)" },
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
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

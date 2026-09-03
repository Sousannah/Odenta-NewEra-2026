/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#EEF2FE",
          100: "#E9EFFB",
          200: "#CBD7F8",
          300: "#A7BAF4",
          400: "#7B94EF",
          500: "#5A76EA",
          600: "#405BE6",
          700: "#3D56E8",
          800: "#2F44BC",
          900: "#27389A",
        },
        ink: {
          DEFAULT: "#263444",
          muted: "#64748B",
          soft: "#94A3B8",
          faint: "#CBD5E1",
        },
        canvas: "#F1F5F9",
        surface: "#FFFFFF",
        success: {
          DEFAULT: "#47B889",
          soft: "#EBF8F2",
          strong: "#199473",
        },
        warning: {
          DEFAULT: "#F7BA21",
          soft: "#FEF6E3",
        },
        danger: {
          DEFAULT: "#E45689",
          soft: "#FDECF2",
        },
        info: {
          DEFAULT: "#61B1FF",
          soft: "#E9F3FF",
        },
        aqua: "#13CACA",
        amber: "#FCB900",
        rose: "#FE3D75",
        violet: "#8B5CF6",
      },
      borderRadius: {
        xl: "10px",
        "2xl": "14px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        pop: "0 12px 32px -8px rgba(16, 24, 40, 0.16), 0 4px 8px -4px rgba(16, 24, 40, 0.08)",
        panel: "-16px 0 48px -24px rgba(16, 24, 40, 0.24)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "scale-in": {
          from: { opacity: 0, transform: "translateY(8px) scale(0.98)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(24px)", opacity: 0 },
          to: { transform: "translateX(0)", opacity: 1 },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

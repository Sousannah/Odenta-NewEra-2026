/** @type {import('tailwindcss').Config} */

/**
 * The Odenta design system.
 *
 * `brand` is the Odenta ocean blue (#0077B6) and `accent` the Odenta teal
 * (#20B2AA) — the two colours the marketing site and every dashboard are built
 * from. Screens reference these scales, never raw hex, so a rebrand is an edit
 * to this file plus `src/theme/tokens.js` (the canvas/SVG mirror of the same
 * values).
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Manrope", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        /* Odenta ocean blue — primary */
        brand: {
          50: "#EAF6FC",
          100: "#D2EAF8",
          200: "#A6D6F1",
          300: "#6FBCE7",
          400: "#329FD9",
          500: "#0E88C6",
          600: "#0077B6",
          700: "#00639A",
          800: "#004F7C",
          900: "#003D62",
        },
        /* Odenta teal — accent, the second half of every gradient */
        accent: {
          50: "#E8FAF8",
          100: "#CDF3F0",
          200: "#9CE8E2",
          300: "#63D9D1",
          400: "#37C6BD",
          500: "#20B2AA",
          600: "#159A93",
          700: "#107C76",
          800: "#0D625E",
          900: "#0A4E4B",
        },
        ink: {
          DEFAULT: "#0F2E3D",
          muted: "#4A6B7C",
          soft: "#7E97A5",
          faint: "#B4C6CF",
        },
        canvas: "#F3F8FB",
        surface: "#FFFFFF",
        success: {
          DEFAULT: "#2BB673",
          soft: "#E7F7EF",
          strong: "#178B55",
          ink: "#0F6B41",
        },
        warning: {
          DEFAULT: "#F5A623",
          soft: "#FEF4E2",
          ink: "#8C6103",
        },
        danger: {
          DEFAULT: "#E4576B",
          soft: "#FDECEF",
          ink: "#9E2438",
        },
        info: {
          DEFAULT: "#3EA0F1",
          soft: "#E7F2FE",
          ink: "#0B5F9E",
        },
        aqua: "#20B2AA",
        amber: "#F5A623",
        rose: "#E4576B",
        violet: "#7C6BF5",
      },
      backgroundImage: {
        /* the Odenta gradient — blue into teal, used on every primary CTA */
        "od-gradient": "linear-gradient(135deg, #0077B6 0%, #20B2AA 100%)",
        "od-gradient-soft": "linear-gradient(135deg, #EAF6FC 0%, #E8FAF8 100%)",
        "od-gradient-deep": "linear-gradient(135deg, #00639A 0%, #0077B6 45%, #20B2AA 100%)",
        "od-radial":
          "radial-gradient(1000px 520px at 12% -10%, rgba(0,119,182,0.12) 0%, rgba(255,255,255,0) 62%), radial-gradient(760px 480px at 92% 8%, rgba(32,178,170,0.14) 0%, rgba(255,255,255,0) 60%)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 46, 61, 0.04), 0 1px 3px rgba(15, 46, 61, 0.06)",
        pop: "0 12px 32px -8px rgba(15, 46, 61, 0.18), 0 4px 8px -4px rgba(15, 46, 61, 0.08)",
        panel: "-16px 0 48px -24px rgba(15, 46, 61, 0.24)",
        brand: "0 12px 28px -10px rgba(0, 119, 182, 0.55)",
        accent: "0 12px 28px -10px rgba(32, 178, 170, 0.5)",
        lift: "0 24px 60px -28px rgba(0, 119, 182, 0.35)",
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
        "rise-in": {
          from: { opacity: 0, transform: "translateY(24px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: 0.55 },
          "70%": { transform: "scale(1.25)", opacity: 0 },
          "100%": { transform: "scale(1.25)", opacity: 0 },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)",
        "rise-in": "rise-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.8s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [],
};

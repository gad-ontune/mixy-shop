/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,mjs}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1557C0",
          50: "#EEF4FF",
          100: "#E8F0FF",
          200: "#CFE0FF",
          300: "#A9C6FF",
          400: "#7FA5FA",
          500: "#4A7BE8",
          600: "#1557C0",
          700: "#124AA5",
          800: "#0F3C86",
          900: "#0B2E66",
        },
        ink: "#111827",
        slate: {
          DEFAULT: "#64748B",
        },
        surface: "#FFFFFF",
        soft: "#F3F4F6",
        pale: "#E8F0FF",
        line: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 24, 39, 0.04)",
        lift: "0 8px 24px rgba(17, 24, 39, 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

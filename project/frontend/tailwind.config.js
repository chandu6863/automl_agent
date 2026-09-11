/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#101316",
          900: "#171c1d",
          800: "#293235",
          100: "#f1f3ee",
          50: "#fafbf7",
        },
        accent: {
          DEFAULT: "#d7f36b",
          muted: "#a9c33f",
        },
        status: {
          verified: "#72d6a1",
          pending: "#f4bd62",
          failed: "#f07878",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "'Segoe UI'", "sans-serif"],
        sans: ["'DM Sans'", "'Segoe UI'", "sans-serif"],
      },
      boxShadow: {
        lift: "0 18px 45px rgba(0, 0, 0, 0.22)",
        glow: "0 0 0 3px rgba(215, 243, 107, 0.16)",
      },
    },
  },
  plugins: [],
};

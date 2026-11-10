/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#005a71",
          container: "#0e7490",
          dark: "#004d62",
          light: "#81d1f0",
        },
        surface: {
          DEFAULT: "#faf8ff",
          muted: "#f2f3ff",
          container: "#eaedff",
          variant: "#dae2fd",
        },
        "text-main": "#131b2e",
        "text-muted": "#3f484c",
        "text-soft": "#6f787d",
        "border-subtle": "#bec8cd",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
// ============================================================
// Token desain VITARA — disalin dari design system proyek Stitch
// "Forest Calm Health" (VITARA Gig Worker Health App):
//   • primary pine #183B38, canvas #F2F5F4, mint #54A195
//   • kartu putih ber-border hairline #E3EAE7, radius 24–28px
//   • heading Plus Jakarta Sans, body/label Inter
// ============================================================
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#183b38",
          dark: "#132e2c",
          deep: "#0d2422",
          soft: "#23524e",
          light: "#a9cec7",
        },
        "surface-canvas": "#f2f5f4",
        "surface-card": "#ffffff",
        "surface-subtle": "#f1f5f3",
        surface: {
          DEFAULT: "#f2f5f4",
          muted: "#f1f5f3",
          container: "#e9efed",
          variant: "#e0e6e3",
        },
        "border-subtle": "#e3eae7",
        "text-primary": "#0d1c1b",
        "text-main": "#0d1c1b",
        "text-muted": "#6e827f",
        "text-soft": "#6e827f",
        "accent-mint": "#54a195",
        "accent-terracotta": "#de6b48",
        "status-alert": "#d9534f",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "28px",
        "5xl": "32px",
      },
      boxShadow: {
        // Elevation 1 — micro-shadow kartu standar (DESIGN.md)
        xs: "0 1px 2px rgba(13, 28, 27, 0.04)",
        soft: "0 4px 20px rgba(13, 28, 27, 0.03)",
        card: "0 4px 20px rgba(13, 28, 27, 0.03)",
        hero: "0 12px 32px rgba(19, 46, 44, 0.16)",
        dock: "0 12px 32px rgba(19, 46, 44, 0.16)",
        sheet: "0 -8px 24px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

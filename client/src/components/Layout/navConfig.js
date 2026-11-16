// ============================================================
// client/src/components/Layout/navConfig.js
// Sumber tunggal daftar navigasi utama VITARA.
// Urutan mengikuti floating dock Stitch: Home/Dasbor, Catat,
// Ergo-Coach, lalu Faskes.
// ============================================================

export const NAV_ITEMS = [
  {
    path: "/dashboard",
    label: "Dasbor",
    labelPanjang: "Dasbor Kesehatan",
    ikon: "home",
  },
  {
    path: "/logger",
    label: "Catat",
    labelPanjang: "Catat Ritme Kerja",
    ikon: "edit_calendar",
  },
  {
    path: "/chat",
    label: "Ergo-Coach",
    labelPanjang: "Ergo-Coach AI",
    ikon: "smart_toy",
  },
  {
    path: "/finder",
    label: "Faskes",
    labelPanjang: "Faskes & Apotek",
    ikon: "location_on",
  },
];

export default NAV_ITEMS;

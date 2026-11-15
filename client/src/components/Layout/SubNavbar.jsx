// ============================================================
// client/src/components/Layout/SubNavbar.jsx
// Bar Navigasi Halaman (Navbar Dalam / Page Sub-Header)
// Sesuai gambar: Berisi Tombol Hamburger, Nama Halaman & Breadcrumb
// ============================================================
import React from "react";
import { useLocation } from "react-router-dom";

const DAFTAR_JUDUL = {
  "/dashboard": { nama: "Dashboard", sub: "Beranda / Dashboard" },
  "/logger": { nama: "Catatan Harian", sub: "Beranda / Catatan Harian" },
  "/chat": { nama: "Konsultasi", sub: "Beranda / Konsultasi" },
  "/finder": { nama: "Faskes", sub: "Beranda / Faskes" },
  "/reminder": { nama: "Reminder", sub: "Beranda / Reminder" },
};

export const SubNavbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const infoHalaman = DAFTAR_JUDUL[location.pathname] || {
    nama: "Dashboard",
    sub: "Beranda / Dashboard",
  };

  return (
    <div className="flex h-16 w-full items-center gap-4 rounded-3xl bg-white px-5 shadow-card transition-colors duration-200">
      {/* Tombol Hamburger Menu */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle Menu"
        className="rounded-full p-1 text-text-muted hover:bg-surface-muted hover:text-primary transition cursor-pointer"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Judul & Breadcrumb */}
      <div className="flex flex-col">
        <h2 className="text-sm font-bold text-text-main leading-tight">
          {infoHalaman.nama}
        </h2>
        <span className="text-[11px] text-text-soft">
          {infoHalaman.sub}
        </span>
      </div>
    </div>
  );
};

export default SubNavbar;

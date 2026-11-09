// ============================================================
// client/src/components/Layout/Navbar.jsx
// Komponen Navbar bagian atas untuk aplikasi VITARA
// Diperbarui sesuai Stitch AI Design System
// ============================================================
import React from "react";
import { Link, useLocation } from "react-router-dom";

const JUDUL_HALAMAN = {
  "/dashboard": "Analisis Performa",
  "/logger": "Catat Harian",
  "/chat": "Konsultasi Ergo-Coach AI",
  "/finder": "Faskes & Apotek",
  "/reminder": "Pengingat Istirahat",
};

export const Navbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const judulAktif = JUDUL_HALAMAN[location.pathname] || "Analisis Performa";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-8">
      {/* Kiri: Hamburger Menu Mobile & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka navigasi menu"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-600 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Dasbor
          </span>
          <span className="text-slate-300 text-xs hidden sm:inline">/</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {judulAktif}
          </h1>
        </div>
      </div>

      {/* Kanan: Profil Driver Singkat */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-800">
            Budi Santoso
          </span>
          <span className="text-[10px] text-slate-400">
            Mitra Pengemudi
          </span>
        </div>

        <Link
          to="/login"
          className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center shadow-xs transition hover:bg-cyan-800"
          title="Profil Pengguna"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;

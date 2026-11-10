// ============================================================
// client/src/components/Layout/Sidebar.jsx
// Komponen Sidebar navigasi untuk aplikasi VITARA
// Diperbarui sesuai Sistem Desain Stitch AI (Outdoor Utility System)
// ============================================================
import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Daftar tautan navigasi aplikasi VITARA
 * Menggunakan naming & ikonik style dari Stitch AI Project
 */
const MENU_NAVIGASI = [
  {
    path: "/dashboard",
    label: "Analisis",
    deskripsi: "Produktivitas vs Kesehatan",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: "/logger",
    label: "Catat Harian",
    deskripsi: "Work-Health Logger (P1)",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: "/chat",
    label: "Konsultasi",
    deskripsi: "Ergo-Coach AI (P2)",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    path: "/finder",
    label: "Faskes & Apotek",
    deskripsi: "Fasilitas Kesehatan (P4)",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    path: "/reminder",
    label: "Pengingat",
    deskripsi: "Micro-Break & Hidrasi (P4)",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop overlay saat sidebar terbuka di layar mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/65 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Kontainer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            {/* Logo V Spine & Heartbeat Pulse */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-700 text-white shadow-xs shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M4 4l4 12 4-8 4 8 4-12" />
                <circle cx="12" cy="12" fill="currentColor" r="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-900 text-base leading-none">
                VITARA
              </span>
              <span className="text-[10px] text-cyan-800 font-semibold tracking-wide uppercase mt-0.5">
                Occupational Health
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
              DRIVER
            </span>

            {/* Tombol Tutup Sidebar di Mobile */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup navigasi menu"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </p>

          {MENU_NAVIGASI.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-cyan-50/80 text-cyan-900 border border-cyan-100/80"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`transition-colors shrink-0 ${
                      isActive ? "text-cyan-700" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">
                      {item.deskripsi}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card di Footer Sidebar */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-700 text-xs font-bold text-white shrink-0">
              BS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                Budi Santoso
              </p>
              <p className="truncate text-[10px] text-slate-500 font-medium">
                Mitra Pengemudi (Ojol)
              </p>
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            SNI ISO 6385:2016 Ergonomi Kerja
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

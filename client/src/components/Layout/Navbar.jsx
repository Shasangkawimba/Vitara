// ============================================================
// client/src/components/Layout/Navbar.jsx
// Header Atas Full Width sesuai Desain Mockup VITARA
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 sm:px-8">
      {/* Kiri: Logo VITARA + DRIVER HEALTH SYSTEM */}
      <Link to="/dashboard" className="flex items-center gap-3 group">
        {/* Ikon V Hijau/Teal Daun & Pulse */}
        <div className="flex items-center justify-center">
          <svg
            className="h-8 w-8 text-teal-600"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bentuk Daun / Tulang Belakang Ergonomis V */}
            <path
              d="M7 6C7 14 11 23 16 27C21 23 25 14 25 6C19 8 13 8 7 6Z"
              stroke="#0d9488"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 11V23"
              stroke="#0d9488"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 15L16 18L20 15"
              stroke="#0d9488"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight text-slate-800">
            VITARA
          </span>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            DRIVER HEALTH SYSTEM
          </span>
        </div>
      </Link>

      {/* Kanan: Theme Toggle, Notifikasi, dan Profil User */}
      <div className="flex items-center gap-5 sm:gap-6">
        {/* Icon Dark/Light Mode (Moon) */}
        <button
          type="button"
          aria-label="Mode Gelap / Terang"
          className="text-slate-500 hover:text-slate-700 transition"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>

        {/* Icon Notifikasi (Bell) */}
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative text-slate-500 hover:text-slate-700 transition"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2">
          {/* Avatar Bulat Biru Muda */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Pengguna</span>
              {/* Chevron Down */}
              <svg
                className="h-3.5 w-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-slate-400 leading-tight">
              Driver
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

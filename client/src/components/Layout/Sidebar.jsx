// ============================================================
// client/src/components/Layout/Sidebar.jsx
// Sidebar Navigasi Vitara - Sesuai Mockup Desain Gambar
// Mode Normal (Lebar 60) & Mode Tertutup / Mini (Lebar 16-20)
// Saat ditutup, hanya memunculkan ikon menu vertikal di tengah
// ============================================================
import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Daftar Menu Utama (Tetap 5 item):
 * 1. Dashboard
 * 2. Catatan Harian (sebelumnya Logger)
 * 3. Konsultasi (sebelumnya AI Coach)
 * 4. Faskes (sebelumnya Finder)
 * 5. Reminder
 */
const MENU_ITEMS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    path: "/logger",
    label: "Catatan Harian",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    path: "/chat",
    label: "Konsultasi",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  {
    path: "/finder",
    label: "Faskes",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    path: "/reminder",
    label: "Reminder",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* ========================================================
          TAMPILAN 1: DESKTOP & LAPTOP (Sesuai Mockup Sidebar Kiri)
          Hidden di mobile (hidden lg:flex), tetap utuh tidak dirubah
         ======================================================== */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out lg:static lg:z-0 lg:rounded-2xl lg:border lg:border-slate-200/80 dark:lg:border-slate-800 lg:shadow-xs ${
          isOpen
            ? "w-60 p-5 shadow-xs"
            : "w-20 p-3.5 items-center"
        }`}
      >
        {/* ========================================================
            KONDISI 1A: DESKTOP TERBUKA (FULL DENGAN TEKS & WIDGET)
           ======================================================== */}
        {isOpen ? (
          <div className="flex h-full w-full flex-col justify-between">
            <div>
              {/* Section Title: MAIN MENU */}
              <div className="pb-3 border-b border-slate-100 mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  MAIN MENU
                </span>
              </div>

              {/* List Navigasi Penuh */}
              <nav className="space-y-1.5">
                {MENU_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#b8d8e5] text-slate-800 font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <span
                            className={`${
                              isActive ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="text-[13px]">{item.label}</span>
                        </div>

                        {/* Panah Indikator Aktif di Sebelah Kanan */}
                        {isActive && (
                          <svg
                            className="h-4 w-4 text-slate-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Section: HEALTH MONITORING (Widget Bawah Sesuai Gambar) */}
            <div className="pt-4 border-t border-slate-100">
              <div className="mb-2.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  HEALTH MONITORING
                </span>
              </div>

              <div className="rounded-xl bg-[#cce3ed] p-3.5 text-slate-800">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/80 text-teal-700 shadow-2xs">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  Jaga Kesehatanmu
                </h4>
                <p className="mt-1 text-[11px] leading-tight text-slate-600">
                  Pantau aktivitas dan kondisi kesehatanmu secara rutin.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             KONDISI 1B: DESKTOP DITUTUP (MINI SIDEBAR PERSIS GAMBAR)
             Hanya menampilkan ikon-ikon menu secara vertikal di tengah
             ======================================================== */
          <div className="flex h-full w-full flex-col items-center pt-2">
            <nav className="flex flex-col items-center gap-5">
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "h-11 w-11 bg-[#b8d8e5] text-slate-800 shadow-xs"
                        : "h-10 w-10 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className={isActive ? "text-slate-800" : "text-slate-500"}>
                      {item.icon}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </aside>

      {/* ========================================================
          TAMPILAN 2: MOBILE BOTTOM NAVIGATION (Navigasi Bawah di Ponsel)
          Hanya muncul di mobile (flex lg:hidden) tetap memiliki 5 menu
          Dirancang muat sempurna tanpa terpotong di layar 320px - 375px
         ======================================================== */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-between border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-1 py-1.5 shadow-lg w-full overflow-hidden"
      >
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-0.5 transition-all min-w-0 ${
                isActive
                  ? "bg-[#cce3ed] dark:bg-slate-800 text-slate-900 dark:text-teal-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 ${isActive ? "text-slate-900 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {/* Skala ikon responsif agar muat di layar sangat sempit (320px) */}
                  <span className="[&>svg]:w-4 [&>svg]:h-4 xs:[&>svg]:w-5 xs:[&>svg]:h-5 block">
                    {item.icon}
                  </span>
                </span>
                <span className="text-[9px] xs:text-[10px] tracking-tighter leading-tight truncate text-center w-full block">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;

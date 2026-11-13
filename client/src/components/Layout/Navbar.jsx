// ============================================================
// client/src/components/Layout/Navbar.jsx
// Header Atas Full Width sesuai Desain Mockup VITARA
// ============================================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Deteksi scroll halaman
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Inisialisasi tema dari localStorage atau preferensi sistem
  const [isDark, setIsDark] = useState(() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  // Terapkan class "dark" ke elemen root <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  // Ambil data user dari localStorage
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    if (stored) user = JSON.parse(stored);
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowDropdown(false);
    navigate("/login");
  };

  return (
    <header
      className={`sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 sm:px-6 lg:px-8 transition-all duration-300 backdrop-blur-md ${
        isScrolled
          ? "bg-white/85 dark:bg-slate-900/85 border-slate-200/80 dark:border-slate-800 shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      }`}
    >
      {/* Kiri: Logo VITARA + DRIVER HEALTH SYSTEM */}
      <Link to="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group">
        {/* Logo Gambar Asli VITARA */}
        <div className="flex items-center justify-center">
          <img
            src="/vitara-logo.png"
            alt="Logo Vitara"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
          />
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-800 dark:text-white">
            VITARA
          </span>
          <span className="hidden xs:inline-block text-[9px] sm:text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
            DRIVER HEALTH SYSTEM
          </span>
        </div>
      </Link>

      {/* Kanan: Theme Toggle dan Profil User */}
      <div className="flex items-center gap-1.5 sm:gap-6">
        {/* Icon Dark/Light Mode (Moon saat terang, Sun saat gelap) */}
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          className="rounded-xl p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-yellow-400 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {isDark ? (
            /* Icon Matahari (Sun) untuk beralih ke Light Mode */
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            /* Icon Bulan (Moon) untuk beralih ke Dark Mode */
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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
          )}
        </button>

        {/* User Profile Pill / Menu */}
        <div className="relative pl-1 sm:pl-2">
          {user ? (
            <div>
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 p-1 transition cursor-pointer"
              >
                {/* Avatar Bulat Biru Muda */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300">
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
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {user.name ? user.name.split(" ")[0] : "Pengguna"}
                    </span>
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
                    {user.occupation || "Driver"}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu Logout */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 shadow-lg z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user.name || "Pengguna"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.phone || "-"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                className="rounded-xl bg-[#cce3ed] hover:bg-[#b8d8e5] text-slate-800 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold transition shadow-2xs whitespace-nowrap"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition whitespace-nowrap"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

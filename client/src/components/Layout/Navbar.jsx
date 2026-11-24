// ============================================================
// client/src/components/Layout/Navbar.jsx
// Header shell VITARA mengikuti desain Stitch:
//   • Desktop: logo kiri, floating dock pine di tengah (grid 1fr auto 1fr),
//     bell + toggle tema + profil pill di kanan.
//   • Mobile: logo kiri; kanan hanya tema + notifikasi + avatar profil ringkas.
// Halaman Dashboard & Logger memakai hero gelap, sehingga header
// otomatis berganti menjadi teks putih di atas gradien pine.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";
import api from "../../services/api";

/** Halaman dengan hero band gelap (header putih di atas pine). */
const HALAMAN_GELAP = ["/dashboard", "/logger", "/chat", "/finder", "/profile", "/reminder"];

const sapaanWaktu = () => {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 19) return "Selamat sore";
  return "Selamat malam";
};

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  // Paksa baca ulang localStorage bila foto profil berubah di halaman Profil.
  const [, setTiketFoto] = useState(0);
  useEffect(() => {
    const sinkron = () => setTiketFoto((t) => t + 1);
    window.addEventListener("vitara-user-changed", sinkron);
    return () => window.removeEventListener("vitara-user-changed", sinkron);
  }, []);

  const gelap = HALAMAN_GELAP.some((path) => location.pathname.startsWith(path));

  // Inisialisasi tema dari localStorage atau preferensi sistem.
  const [isDark, setIsDark] = useState(() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

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

  // Tutup dropdown saat berpindah halaman.
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // Tutup dropdown saat mengeklik di luar menu profil.
  useEffect(() => {
    if (!showDropdown) return;
    const tutup = (e) => {
      if (!e.target.closest("[data-menu-profil]")) setShowDropdown(false);
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [showDropdown]);

  let user = null;
  try {
    const stored = localStorage.getItem("user");
    if (stored) user = JSON.parse(stored);
  } catch {
    user = null;
  }

  const inisial = useMemo(() => {
    if (!user?.name) return "V";
    return user.name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((kata) => kata[0])
      .join("")
      .toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Tetap bersihkan cache lokal bila server sedang tidak merespons.
    }
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("vitara-user-changed"));
    setShowDropdown(false);
    navigate("/login");
  };

  const tombolTema = (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
        gelap
          ? "glass-icon text-white hover:bg-white/20"
          : "border border-border-subtle bg-surface-card text-text-muted hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-[19px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );

  const tombolNotifikasi = (
    <Link
      to="/reminder"
      aria-label="Pengingat & notifikasi"
      title="Pengingat & notifikasi"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        gelap
          ? "glass-icon text-white hover:bg-white/20"
          : "border border-border-subtle bg-surface-card text-text-primary shadow-xs hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-[19px]">notifications</span>
    </Link>
  );

  // Menu dropdown profil — dipakai di Desktop (pill penuh) dan
  // Mobile (avatar + nama) supaya perilaku identik di kedua moda.
  const menuProfil = (
    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-3xl border border-border-subtle bg-surface-card p-1.5 shadow-card">
      <div className="border-b border-border-subtle px-3.5 py-2.5">
        <p className="truncate text-xs font-bold text-text-primary">
          {user?.name || "Pengguna"}
        </p>
        <p className="truncate text-[10px] text-text-muted">
          {user?.phone || "-"}
        </p>
      </div>
      <Link
        to="/profile"
        className="mt-1 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-subtle hover:text-primary"
      >
        <span className="material-symbols-outlined text-[17px]">person</span>
        Profil Saya
      </Link>
      <Link
        to="/reminder"
        className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-subtle hover:text-primary"
      >
        <span className="material-symbols-outlined text-[17px]">alarm</span>
        Pengingat kesehatan
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        <span className="material-symbols-outlined text-[17px]">logout</span>
        Keluar
      </button>
    </div>
  );

  const profilPill = user ? (
    <div className="relative" data-menu-profil>
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        className={`flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors cursor-pointer ${
          gelap
            ? "glass-pill text-white hover:bg-white/15"
            : "border border-border-subtle bg-surface-card text-text-primary shadow-xs hover:bg-surface-subtle"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold tracking-tight ${
            gelap
              ? "border border-white/25 bg-white/20 text-white"
              : "bg-primary/10 text-primary"
          }`}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt={`Foto ${user.name || "profil"}`}
              className="h-full w-full object-cover"
            />
          ) : (
            inisial
          )}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span
            className={`block text-[9px] font-medium ${
              gelap ? "text-white/65" : "text-text-muted"
            }`}
          >
            {sapaanWaktu()}
          </span>
          <span className="block max-w-[110px] truncate text-[11px] font-semibold">
            {user.name || "Pengguna VITARA"}
          </span>
        </span>
      </button>

      {showDropdown && menuProfil}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
          gelap
            ? "glass-pill text-white hover:bg-white/15"
            : "bg-primary text-white hover:bg-primary-dark"
        }`}
      >
        Masuk
      </Link>
    </div>
  );

  // Mobile: avatar + nama depan di sampingnya + dropdown yang sama dengan Desktop.
  const namaDepan = user?.name ? user.name.trim().split(" ")[0] : "";
  const profilMobile = user ? (
    <div className="relative" data-menu-profil>
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        aria-label="Buka menu profil"
        aria-expanded={showDropdown}
        title="Buka menu profil"
        className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors ${
          gelap
            ? "glass-icon text-white hover:bg-white/15"
            : "border border-border-subtle bg-surface-card text-text-primary shadow-xs hover:bg-surface-subtle"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold tracking-tight ${
            gelap
              ? "border border-white/25 bg-white/20 text-white"
              : "bg-primary/10 text-primary"
          }`}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt={`Foto ${user.name || "profil"}`}
              className="h-full w-full object-cover"
            />
          ) : (
            inisial
          )}
        </span>
        <span className="max-w-[92px] truncate text-[12px] font-semibold">
          {namaDepan}
        </span>
        <span
          className={`material-symbols-outlined shrink-0 text-[16px] transition-transform duration-200 ${
            showDropdown ? "rotate-180" : ""
          } ${gelap ? "text-white/70" : "text-text-muted"}`}
        >
          expand_more
        </span>
      </button>

      {showDropdown && menuProfil}
    </div>
  ) : (
    <Link
      to="/login"
      className="rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-primary-dark"
    >
      Masuk
    </Link>
  );

  return (
    <header className="relative z-40 w-full">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pb-2 pt-4 lg:px-12 lg:pt-6">
        {/* Kiri: brand — selalu tampil (ikon + teks) */}
        <div className="col-start-1 flex items-center justify-self-start">
          <Link
            to="/dashboard"
            className="group flex items-center gap-2.5"
            aria-label="VITARA — beranda"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full lg:h-10 lg:w-10 ${
                gelap
                  ? "glass-icon text-white"
                  : "border border-border-subtle bg-surface-card text-primary shadow-xs"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">vital_signs</span>
            </span>
            <span
              className={`font-display text-[17px] font-bold tracking-tight lg:text-lg ${
                gelap ? "text-white" : "text-text-primary"
              }`}
            >
              VITARA
            </span>
          </Link>
        </div>

        {/* Desktop: floating dock navigasi di tengah */}
        <nav
          aria-label="Navigasi utama VITARA"
          className={`col-start-2 hidden items-center gap-1 rounded-full border p-1.5 lg:flex ${
            gelap
              ? "border-white/10 bg-[#122c2a]/90 shadow-hero backdrop-blur-md"
              : "border-border-subtle bg-surface-card/95 shadow-card backdrop-blur-md"
          }`}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.labelPanjang}
              aria-label={item.labelPanjang}
              className={({ isActive }) =>
                `flex min-w-[54px] flex-col items-center justify-center gap-[3px] rounded-2xl px-3 py-1.5 transition-colors ${
                  isActive
                    ? gelap
                      ? "bg-[#f7faf9] text-[#183b38] shadow-xs"
                      : "bg-primary text-white shadow-xs"
                    : gelap
                    ? "text-white/60 hover:text-white"
                    : "text-text-muted hover:bg-surface-subtle hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[19px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {item.ikon}
                  </span>
                  <span className="text-[10px] font-semibold leading-none tracking-wide">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Kanan: notifikasi, tema, profil */}
        <div className="col-start-3 flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {tombolNotifikasi}
            {tombolTema}
          </div>
          <div className="hidden lg:block">{profilPill}</div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {tombolTema}
            {tombolNotifikasi}
            {profilMobile}
          </div>
        </div>
      </div>

      {/* Garis tipis pemisah pada halaman terang */}
      {!gelap && (
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-12">
          <div className="h-px w-full bg-border-subtle" />
        </div>
      )}
    </header>
  );
};

export default Navbar;

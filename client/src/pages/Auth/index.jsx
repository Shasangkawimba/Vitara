// ============================================================
// client/src/pages/Auth/index.jsx
// Titik masuk modul Autentikasi (Login & Register).
// Dikelola oleh P1 (Auth & Logger).
// Tata letak mengikuti bahasa desain Stitch: panel pine di kiri
// (desktop) yang tetap diam saat form digulir, hero gradasi pine
// bertekstur di mobile, dan kartu form di kanan dengan satu aksen.
// ============================================================
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";

const NILAI_UTAMA = [
  {
    ikon: "edit_calendar",
    judul: "Catat ritme kerja",
    ket: "Durasi shift, pendapatan, dan keluhan fisik harian.",
  },
  {
    ikon: "monitoring",
    judul: "Lihat korelasi beban",
    ket: "Grafik jam kerja vs keluhan untuk menakar kelelahan.",
  },
  {
    ikon: "location_on",
    judul: "Faskes & pengingat",
    ket: "Apotek terdekat, alarm hidrasi, dan panduan pemulihan.",
  },
];

export default function AuthPage({ initialMode = "login" }) {
  const [authMode, setAuthMode] = useState(initialMode); // "login" | "register"

  return (
    <div className="flex min-h-screen w-full flex-col bg-tekstur-kanvas lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Panel brand (desktop) */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="tekstur-kontur-putih pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-16 h-[260px] w-[260px] rounded-full border border-white/10"
        />

        <Link to="/" className="relative flex w-fit items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <span className="material-symbols-outlined text-[20px]">vital_signs</span>
          </span>
          <span className="font-display text-lg font-bold tracking-tight">VITARA</span>
        </Link>

        <div className="relative max-w-md">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Kesehatan kerja mitra gig
          </span>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.2] tracking-tight">
            Jaga ritme kerja, jaga tubuh yang menopang penghasilan Anda.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60 font-body">
            VITARA membantu pengemudi dan kurir memahami hubungan jam kerja,
            pendapatan, dan keluhan fisik — tanpa alat tambahan.
          </p>

          <ul className="mt-8 space-y-4">
            {NILAI_UTAMA.map((item) => (
              <li key={item.ikon} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <span className="material-symbols-outlined text-[18px]">
                    {item.ikon}
                  </span>
                </span>
                <span>
                  <span className="block text-[13px] font-semibold">{item.judul}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/55 font-body">
                    {item.ket}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-[11px] text-white/50">
          <span>© 2026 VITARA — Platform Kebugaran &amp; Ritme Kerja Mitra</span>
          <a
            href="tel:119"
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-white/80 transition-colors hover:text-white"
          >
            <span className="material-symbols-outlined text-[15px]">call</span>
            Darurat 119
          </a>
        </div>
      </aside>

      {/* Hero gradasi pine bertekstur (mobile) — seragam dengan halaman lain.
          Teks dibuat kontras tinggi (glow mint di belakang logo, drop-shadow). */}
      <header className="hero-gradient relative flex flex-col items-center overflow-hidden px-5 pb-14 pt-10 text-center text-white lg:hidden">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 rounded-full bg-accent-mint/20 blur-2xl"
        />
        <Link
          to="/"
          className="relative flex flex-col items-center"
          aria-label="Kembali ke halaman utama VITARA"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/15 shadow-lg shadow-black/25">
            <span className="material-symbols-outlined text-[26px] drop-shadow">
              vital_signs
            </span>
          </span>
          <span className="mt-3 font-display text-[22px] font-extrabold tracking-tight text-white drop-shadow-md">
            VITARA
          </span>
        </Link>
        <p className="relative mt-1 max-w-xs text-xs font-medium leading-relaxed text-white/85 drop-shadow-sm">
          Kebugaran &amp; ritme kerja mitra gig
        </p>
      </header>

      {/* Area form — gulir mandiri di desktop, panel brand tetap terlihat.
          Di mobile, konten dinaikkan agar kartu menumpuk di atas hero. */}
      <div className="-mt-6 flex w-full flex-1 flex-col px-5 pb-10 pt-6 lg:mt-0 lg:overflow-y-auto lg:px-12 lg:pt-5">
        <div className="m-auto flex w-full max-w-md flex-col">
          {/* Switcher tab pill */}
          <div className="inline-flex self-center rounded-full border border-border-subtle bg-surface-subtle p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`rounded-full px-6 py-2 text-xs font-semibold transition-all ${
              authMode === "login"
                ? "bg-surface-card text-primary shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`rounded-full px-6 py-2 text-xs font-semibold transition-all ${
              authMode === "register"
                ? "bg-surface-card text-primary shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        <div className="mt-5 w-full">
          {authMode === "login" ? (
            <Login onSwitchToRegister={() => setAuthMode("register")} />
          ) : (
            <Register onSwitchToLogin={() => setAuthMode("login")} />
          )}
        </div>

          <div className="mt-6 text-center text-[11px] leading-relaxed text-text-muted">
            <p>© 2026 VITARA — Virtual Assistant for Tracking and Recovery</p>
            <p className="mt-1">Kesehatan Kerja &amp; Kebugaran Pekerja Informal Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Login, Register };

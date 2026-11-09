// ============================================================
// client/src/App.jsx — HAK MILIK MUTLAK P3
// Anggota lain DILARANG mengedit file ini (lihat AGENTS.md aturan emas no. 3).
// Untuk sementara, setiap rute menggunakan placeholder. Pemilik halaman
// (P1, P2, P4) membuat halaman di folder masing-masing, kemudian P3
// akan menghubungkan import komponen halaman tersebut ke file App.jsx ini.
// ============================================================
import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/Dashboard";

/**
 * Komponen Placeholder Standar
 * Digunakan sementara sebelum modul halaman resmi diintegrasikan oleh masing-masing pemilik rute.
 */
const PlaceholderPage = ({ nama, pemilik, deskripsi, tagWarna = "emerald" }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 font-bold text-2xl shadow-inner">
        {pemilik.substring(0, 2)}
      </div>
      <span className="mb-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        Tanggung Jawab: {pemilik}
      </span>
      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
        {nama}
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {deskripsi || "Modul ini sedang dalam tahap pengembangan (Minggu 1)."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/dashboard"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};

/**
 * Komponen Halaman Login Mandiri (Tanpa Shell Layout)
 * Dikelola oleh P1 (Auth)
 */
const LoginPlaceholder = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-xl">
            V
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Masuk ke VITARA
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Halaman Login & Registrasi Akun (Tanggung Jawab P1)
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center border border-slate-200">
          <p className="text-xs text-slate-600 font-medium">
            Form autentikasi P1 akan dipasang di sini.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="inline-block w-full rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Masuk Langsung ke Dashboard Demo
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Komponen Halaman 404 Not Found
 */
const NotFoundPage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-black text-slate-300">404</h1>
      <h2 className="mt-4 text-xl font-bold text-slate-800">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Rute yang Anda tuju tidak terdaftar di sistem VITARA.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
      >
        Menuju Dashboard
      </Link>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* 1. Halaman Publik / Auth (Tanpa Layout Shell) */}
      <Route path="/login" element={<LoginPlaceholder />} />

      {/* 2. Halaman Internal Aplikasi (Dibungkus Layout Shell: Navbar & Sidebar) */}
      <Route element={<Layout />}>
        {/* Rute Awal: Arahkan ke Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rute Dashboard — Tanggung Jawab P3 */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Rute Catatan Harian (Logger) — Tanggung Jawab P1 */}
        <Route
          path="/logger"
          element={
            <PlaceholderPage
              nama="Pencatatan Harian (Logger)"
              pemilik="P1 (Logger)"
              deskripsi="Form pencatatan jam kerja, pendapatan, serta keluhan fisik harian dan Quick-Log."
            />
          }
        />

        {/* Rute Ergo-Coach AI (Chat) — Tanggung Jawab P2 */}
        <Route
          path="/chat"
          element={
            <PlaceholderPage
              nama="Ergo-Coach AI"
              pemilik="P2 (AI Engine)"
              deskripsi="Sesi konsultasi interaktif berbasis AI untuk evaluasi ergonomi dan keluhan kerja."
            />
          }
        />

        {/* Rute Finder Fasilitas Kesehatan — Tanggung Jawab P4 */}
        <Route
          path="/finder"
          element={
            <PlaceholderPage
              nama="Finder Fasilitas Kesehatan"
              pemilik="P4 (Finder)"
              deskripsi="Peta interaktif Leaflet untuk mencari apotek dan klinik terdekat (radius 3 km)."
            />
          }
        />

        {/* Rute Pengingat (Reminder) — Tanggung Jawab P4 */}
        <Route
          path="/reminder"
          element={
            <PlaceholderPage
              nama="Pengingat Istirahat & Hidrasi"
              pemilik="P4 (Reminder)"
              deskripsi="Notifikasi berkala pengingat waktu istirahat dan peregangan fisik gig worker."
            />
          }
        />

        {/* Catch-all 404 di dalam layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

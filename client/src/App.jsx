// ============================================================
// client/src/App.jsx - HAK MILIK MUTLAK P3
// Anggota lain DILARANG mengedit file ini (lihat AGENTS.md aturan emas no. 3).
// Untuk sementara, setiap rute menggunakan placeholder. Pemilik halaman
// (P1, P2, P4) membuat halaman di folder masing-masing, kemudian P3
// akan menghubungkan import komponen halaman tersebut ke file App.jsx ini.
// ============================================================
import React, { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/Landing";
import AuthPage from "./pages/Auth";
import OAuthCallback from "./pages/Auth/OAuthCallback";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Logger from "./pages/Logger";

// Halaman berat dimuat saat rute dibuka agar bundle awal lebih ringan.
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ReminderPage = lazy(() => import("./pages/Reminder"));
const FinderPage = lazy(() => import("./pages/Finder"));
const ChatPage = lazy(() => import("./pages/Chat"));
const ProfilePage = lazy(() => import("./pages/Profile"));

const MuatHalaman = () => (
  <div className="flex min-h-[60vh] items-center justify-center gap-2">
    <span className="material-symbols-outlined animate-spin text-primary">
      progress_activity
    </span>
    <span className="text-sm text-text-muted">Memuat halaman...</span>
  </div>
);

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
        className="mt-6 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition"
      >
        Menuju Dashboard
      </Link>
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<MuatHalaman />}>
      <Routes>
        {/* 1. Halaman Publik / Auth / Landing (Tanpa Layout Shell) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/lupa-sandi" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 2. Halaman Internal Aplikasi (Dibungkus Layout Shell: Navbar & Sidebar) */}
        <Route element={<Layout />}>
          {/* Rute Awal ditangani oleh LandingPage di atas */}

          {/* Rute Dashboard - Tanggung Jawab P3 */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Rute Catatan Harian (Logger) - Tanggung Jawab P1 */}
          <Route path="/logger" element={<Logger />} />

          {/* Rute Ergo-Coach AI (Chat) - Tanggung Jawab P2 */}
          <Route path="/chat" element={<ChatPage />} />

          {/* Rute Finder Fasilitas Kesehatan - Tanggung Jawab P4 */}
          <Route path="/finder" element={<FinderPage />} />

          {/* Rute Pengingat (Reminder) - Tanggung Jawab P4 */}
          <Route path="/reminder" element={<ReminderPage />} />

          {/* Rute Profil Pengguna - milik bersama, mengikuti shell P3 */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Catch-all 404 di dalam layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

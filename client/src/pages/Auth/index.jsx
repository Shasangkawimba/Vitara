// ============================================================
// client/src/pages/Auth/index.jsx
// Titik masuk modul Halaman Autentikasi (Login & Register).
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function AuthPage({ initialMode = "login" }) {
  const [authMode, setAuthMode] = useState(initialMode); // "login" | "register"

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      {/* Switcher Tab Pill */}
      <div className="mb-6 p-1 bg-surface-muted rounded-xl border border-border-subtle inline-flex shadow-xs">
        <button
          type="button"
          onClick={() => setAuthMode("login")}
          className={`px-6 py-2 rounded-lg text-xs font-bold font-display transition-all ${
            authMode === "login"
              ? "bg-white text-primary shadow-xs"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setAuthMode("register")}
          className={`px-6 py-2 rounded-lg text-xs font-bold font-display transition-all ${
            authMode === "register"
              ? "bg-white text-primary shadow-xs"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Daftar Baru
        </button>
      </div>

      {/* Render Component */}
      {authMode === "login" ? (
        <Login onSwitchToRegister={() => setAuthMode("register")} />
      ) : (
        <Register onSwitchToLogin={() => setAuthMode("login")} />
      )}

      {/* Bottom Info */}
      <div className="mt-8 text-center text-xs text-text-soft">
        <p>© 2024 VITARA — Virtual Assistant for Tracking and Recovery</p>
        <p className="mt-1">Kesehatan Kerja & Kebugaran Pekerja Informal Indonesia</p>
      </div>
    </div>
  );
}

export { Login, Register };


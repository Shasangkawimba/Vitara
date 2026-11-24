// ============================================================
// client/src/pages/Auth/Login.jsx
// Form masuk mitra VITARA.
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import GoogleButton from "./GoogleButton";

export default function Login({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  // State Form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  /* Kegagalan login (salah email maupun salah sandi):
     hanya kolom sandi yang dikosongkan, email tetap utuh,
     pesan error tetap tampil, dan fokus kembali ke kolom sandi. */
  const gagalLogin = (pesan) => {
    setErrorMessage(pesan);
    setFormData((prev) => ({ ...prev, password: "" }));
    passwordRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.username.trim() || !formData.password) {
      setErrorMessage("Username dan kata sandi wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/api/auth/login", {
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data?.success) {
        const { user } = response.data.data;
        // JWT kini berupa cookie httpOnly. Cache profil hanya untuk UI.
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("vitara-user-changed"));

        // Navigasi ke halaman Logger
        navigate("/logger");
      } else {
        gagalLogin(
          response.data?.error || "Gagal masuk. Silakan periksa kembali data Anda."
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Gagal terhubung ke server. Pastikan backend sudah berjalan.";
      gagalLogin(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-4xl border border-border-subtle bg-surface-card p-6 shadow-card sm:p-7">
      <div className="mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">login</span>
        </span>
        <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-text-primary">
          Selamat datang kembali
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-text-muted font-body">
          Masuk untuk melanjutkan pencatatan ritme kerja harian Anda.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-red-600">
            error
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* autoComplete dimatikan: dropdown simpanan browser menutupi field di bawahnya. */}
      <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
        {/* Input Username */}
        <div>
          <label
            htmlFor="login-username"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Username
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">alternate_email</span>
            </div>
            <input
              id="login-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Contoh: budi_santoso"
              autoComplete="off"
              required
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
          </div>
        </div>

        {/* Input Kata Sandi */}
        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Kata sandi
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan kata sandi"
              autoComplete="new-password"
              required
              ref={passwordRef}
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-11 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted transition-colors hover:text-text-primary"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="text-right">
          <Link
            to="/lupa-sandi"
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[19px]">
                progress_activity
              </span>
              <span>Memproses masuk…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[19px]">login</span>
              <span>Masuk sekarang</span>
            </>
          )}
        </button>
      </form>

      {/* CTA Google di bawah form */}
      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-text-muted">
        <span className="h-px flex-1 bg-border-subtle" />
        atau
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <GoogleButton label="Masuk dengan Google" />

      {/* Switcher */}
      <div className="mt-6 border-t border-border-subtle pt-5 text-center">
        <p className="text-xs text-text-muted">
          Belum punya akun VITARA?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="ml-1 font-semibold text-primary hover:underline"
          >
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  );
}

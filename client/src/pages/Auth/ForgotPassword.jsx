// ============================================================
// client/src/pages/Auth/ForgotPassword.jsx
// Form permintaan tautan reset kata sandi lewat email.
// ============================================================
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGalat("");
    setPesan("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setGalat("Format email tidak valid.");
      return;
    }

    try {
      setMemuat(true);
      const respons = await api.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setPesan(
        respons.data?.data?.message ||
          "Jika email terdaftar, tautan reset sudah dikirim."
      );
    } catch (err) {
      setGalat(
        err.response?.data?.error ||
          "Gagal mengirim permintaan. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-tekstur-kanvas px-5 py-12">
      <div className="w-full max-w-md rounded-4xl border border-border-subtle bg-surface-card p-6 shadow-card sm:p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">lock_reset</span>
        </span>
        <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-text-primary">
          Lupa kata sandi
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          Masukkan email yang terdaftar. Kami akan mengirim tautan untuk membuat
          kata sandi baru.
        </p>

        {galat && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-red-600">
              error
            </span>
            <span>{galat}</span>
          </div>
        )}

        {pesan ? (
          <div className="mt-5 rounded-2xl border border-accent-mint/40 bg-accent-mint/10 p-4 text-sm text-text-primary">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[20px] text-primary">
                mark_email_read
              </span>
              Periksa email Anda
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{pesan}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label
                htmlFor="lupa-email"
                className="mb-1.5 block text-[13px] font-medium text-text-muted"
              >
                Email
              </label>
              <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="lupa-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (galat) setGalat("");
                  }}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none sm:py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={memuat}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {memuat ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[19px]">
                    progress_activity
                  </span>
                  Mengirim...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[19px]">send</span>
                  Kirim tautan reset
                </>
              )}
            </button>

            <p className="text-center text-xs text-text-muted">
              Ingat kata sandi?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Masuk
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

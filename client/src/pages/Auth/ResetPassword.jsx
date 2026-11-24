// ============================================================
// client/src/pages/Auth/ResetPassword.jsx
// Halaman atur kata sandi baru dari tautan email.
// ============================================================
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [tampilSandi, setTampilSandi] = useState(false);
  const [galat, setGalat] = useState("");
  const [berhasil, setBerhasil] = useState(false);
  const [memuat, setMemuat] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGalat("");

    if (password.length < 6) {
      setGalat("Kata sandi minimal 6 karakter.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setGalat("Kata sandi harus berisi huruf dan angka.");
      return;
    }
    if (password !== konfirmasi) {
      setGalat("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setMemuat(true);
      await api.post("/api/auth/reset-password", { token, password });
      setBerhasil(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setGalat(
        err.response?.data?.error ||
          "Gagal mengatur ulang kata sandi. Tautan mungkin sudah kedaluwarsa."
      );
    } finally {
      setMemuat(false);
    }
  };

  const tokenTidakAda = !token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-tekstur-kanvas px-5 py-12">
      <div className="w-full max-w-md rounded-4xl border border-border-subtle bg-surface-card p-6 shadow-card sm:p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">password</span>
        </span>
        <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-text-primary">
          Atur kata sandi baru
        </h1>

        {tokenTidakAda ? (
          <>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Tautan reset tidak lengkap. Minta tautan baru dari halaman lupa kata sandi.
            </p>
            <Link
              to="/lupa-sandi"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-[16px]">lock_reset</span>
              Minta tautan baru
            </Link>
          </>
        ) : berhasil ? (
          <div className="mt-4 rounded-2xl border border-accent-mint/40 bg-accent-mint/10 p-4 text-sm text-text-primary">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[20px] text-primary">
                check_circle
              </span>
              Kata sandi berhasil diperbarui
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Anda akan diarahkan ke halaman masuk.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.
            </p>

            {galat && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-red-600">
                  error
                </span>
                <span>{galat}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label
                  htmlFor="sandi-baru"
                  className="mb-1.5 block text-[13px] font-medium text-text-muted"
                >
                  Kata sandi baru
                </label>
                <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    id="sandi-baru"
                    type={tampilSandi ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter, huruf dan angka"
                    autoComplete="new-password"
                    required
                    className="w-full bg-transparent py-3 pl-11 pr-11 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none sm:py-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => setTampilSandi((v) => !v)}
                    aria-label={tampilSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text-primary"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {tampilSandi ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sandi-konfirmasi"
                  className="mb-1.5 block text-[13px] font-medium text-text-muted"
                >
                  Ulangi kata sandi baru
                </label>
                <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                  <input
                    id="sandi-konfirmasi"
                    type={tampilSandi ? "text" : "password"}
                    value={konfirmasi}
                    onChange={(e) => setKonfirmasi(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    autoComplete="new-password"
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
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[19px]">save</span>
                    Simpan kata sandi baru
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

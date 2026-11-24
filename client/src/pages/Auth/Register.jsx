// ============================================================
// client/src/pages/Auth/Register.jsx
// Form registrasi mitra baru VITARA.
// Dirancang untuk pekerja gig (ojol, kurir, dll).
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GoogleButton from "./GoogleButton";

const OCCUPATION_OPTIONS = [
  "Driver Ojol (Motor)",
  "Driver Online (Mobil)",
  "Kurir Logistik",
  "Supir Truk / Ekspedisi",
  "Buruh / Pekerja Pabrik",
  "Pekerja Bebas Lainnya",
];

export default function Register({ onSwitchToLogin }) {
  const navigate = useNavigate();

  // State Form
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    occupation: "Driver Ojol (Motor)",
    password: "",
    confirmPassword: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validasi client-side
    if (!formData.name.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }
    const usernameBersih = formData.username.trim().toLowerCase();
    if (!usernameBersih) {
      setErrorMessage("Username wajib diisi.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(usernameBersih)) {
      setErrorMessage(
        "Username 3–20 karakter, hanya huruf kecil, angka, dan underscore (_)."
      );
      return;
    }
    // Nomor telepon opsional: boleh diisi nanti lewat halaman Profil.
    const teleponBersih = formData.phone.trim();
    if (
      teleponBersih &&
      !/^(\+62|62|0)8[0-9]{7,12}$/.test(teleponBersih.replace(/[\s\-()]/g, ""))
    ) {
      setErrorMessage("Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }
    if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setErrorMessage("Kata sandi harus berisi huruf dan angka.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/api/auth/register", {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        occupation: formData.occupation,
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
        setErrorMessage(
          response.data?.error || "Gagal mendaftar. Silakan coba kembali."
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Gagal mendaftarkan akun. Silakan periksa koneksi server Anda.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-4xl border border-border-subtle bg-surface-card p-6 shadow-card sm:p-7">
      <div className="mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </span>
        <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-text-primary">
          Daftar akun VITARA
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-text-muted font-body">
          Mulai pantau korelasi jam kerja, kelelahan, dan kesehatan Anda.
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Input Nama Lengkap */}
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Nama lengkap
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <input
              id="register-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
          </div>
        </div>

        {/* Baris dua kolom: Username | Nomor telepon */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Input Username */}
        <div>
          <label
            htmlFor="register-username"
            className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-medium text-text-muted"
          >
            <span>Username</span>
            <span className="text-[10px] font-normal text-text-muted/75">
              3–20 karakter
            </span>
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">alternate_email</span>
            </div>
            <input
              id="register-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Contoh: budi_santoso"
              autoComplete="username"
              required
              maxLength={20}
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
          </div>
        </div>

        {/* Input Nomor HP */}
        <div>
          <label
            htmlFor="register-phone"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            No. telepon (WA, opsional)
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
            </div>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
          </div>
        </div>

        </div>

        {/* Pilihan Profesi */}
        <div>
          <label
            htmlFor="register-occupation"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Jenis pekerjaan utama
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
            </div>
            <select
              id="register-occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="w-full cursor-pointer appearance-none bg-transparent py-3 sm:py-2.5 pl-11 pr-8 text-sm text-text-primary focus:outline-none"
            >
              {OCCUPATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Baris dua kolom: Kata sandi | Ulangi kata sandi */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Input Kata Sandi */}
        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Kata sandi
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 6 karakter, huruf dan angka"
              required
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

        {/* Input Konfirmasi Kata Sandi */}
        <div>
          <label
            htmlFor="register-confirm"
            className="mb-1.5 block text-[13px] font-medium text-text-muted"
          >
            Ulangi kata sandi
          </label>
          <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ulangi kata sandi"
              required
              className="w-full bg-transparent py-3 sm:py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
            />
          </div>
        </div>

        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[19px]">
                progress_activity
              </span>
              <span>Mendaftarkan akun…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[19px]">person_add</span>
              <span>Daftar akun sekarang</span>
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

      <GoogleButton label="Daftar dengan Google" />

      {/* Switcher */}
      <div className="mt-6 border-t border-border-subtle pt-5 text-center">
        <p className="text-xs text-text-muted">
          Sudah memiliki akun VITARA?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="ml-1 font-semibold text-primary hover:underline"
          >
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}

// ============================================================
// client/src/pages/Auth/Register.jsx
// Halaman Registrasi Pengguna Baru VITARA.
// Dirancang khusus untuk pekerja gig (ojol, kurir, dll).
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import VitaraLogo from "../../components/VitaraLogo";

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
    if (!formData.phone.trim()) {
      setErrorMessage("Nomor telepon wajib diisi.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
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
        phone: formData.phone.trim(),
        occupation: formData.occupation,
        password: formData.password,
      });

      if (response.data?.success) {
        const { token, user } = response.data.data;
        // Simpan token JWT & profil
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Navigasi ke halaman Logger
        navigate("/logger");
      } else {
        setErrorMessage(response.data?.error || "Gagal mendaftar. Silakan coba kembali.");
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
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <VitaraLogo className="w-14 h-14" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-text-main tracking-tight">
          Daftar Akun VITARA
        </h1>
        <p className="text-sm text-text-soft mt-1">
          Mulai pantau korelasi jam kerja, kelelahan, dan kesehatanmu
        </p>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-2xl border border-surface-container shadow-sm p-6 sm:p-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] shrink-0 text-red-600 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-muted/30">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-text-main placeholder:text-text-soft/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Input Nomor HP */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Nomor Telepon (WhatsApp)
            </label>
            <div className="relative rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-muted/30">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Contoh: 08123456789"
                required
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-text-main placeholder:text-text-soft/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Pilihan Profesi / Pekerjaan */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Jenis Pekerjaan Utama
            </label>
            <div className="relative rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-muted/30">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
              </div>
              <select
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full pl-11 pr-8 py-3 bg-transparent text-sm text-text-main focus:outline-none appearance-none cursor-pointer"
              >
                {OCCUPATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Input Kata Sandi */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Kata Sandi (Min. 6 Karakter)
            </label>
            <div className="relative rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-muted/30">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 6 karakter"
                required
                className="w-full pl-11 pr-11 py-3 bg-transparent text-sm text-text-main placeholder:text-text-soft/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-soft hover:text-text-main transition-colors"
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
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Ulangi Kata Sandi
            </label>
            <div className="relative rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-muted/30">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-soft">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ketik ulang kata sandi"
                required
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-text-main placeholder:text-text-soft/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 h-12 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-display font-bold text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Daftar Akun Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Card Switcher */}
        <div className="mt-6 pt-5 border-t border-surface-container text-center">
          <p className="text-xs text-text-soft">
            Sudah memiliki akun VITARA?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary font-bold hover:underline ml-1"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


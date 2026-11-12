// ============================================================
// client/src/pages/Auth/Login.jsx
// Halaman Login Mitra VITARA (Mobile-first PWA & Desktop Clean).
// Menggunakan standar Stitch UI/UX & Tailwind CSS.
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import VitaraLogo from "../../components/VitaraLogo";

export default function Login({ onSwitchToRegister }) {
  const navigate = useNavigate();

  // State Form
  const [formData, setFormData] = useState({
    phone: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.phone.trim() || !formData.password) {
      setErrorMessage("Nomor telepon dan kata sandi wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/api/auth/login", {
        phone: formData.phone.trim(),
        password: formData.password,
      });

      if (response.data?.success) {
        const { token, user } = response.data.data;
        // Simpan token JWT sesuai kontrak services/api.js
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Navigasi ke halaman Logger
        navigate("/logger");
      } else {
        setErrorMessage(response.data?.error || "Gagal masuk. Silakan periksa kembali data Anda.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Gagal terhubung ke server. Pastikan backend sudah berjalan.";
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
          Selamat Datang Kembali
        </h1>
        <p className="text-sm text-text-soft mt-1">
          Masuk ke akun VITARA untuk melanjutkan pencatatan harian
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
          {/* Input Nomor HP */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Nomor Telepon
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

          {/* Input Kata Sandi */}
          <div>
            <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">
              Kata Sandi
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
                placeholder="Masukkan kata sandi"
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

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-12 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-display font-bold text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Card Switcher */}
        <div className="mt-6 pt-5 border-t border-surface-container text-center">
          <p className="text-xs text-text-soft">
            Belum punya akun VITARA?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary font-bold hover:underline ml-1"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


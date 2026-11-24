// ============================================================
// services/api.js — Standar bersama seluruh anggota VITARA.
// Semua request API frontend WAJIB lewat instance axios ini
// (aturan teknis di AGENTS.md). Jangan buat axios.create() sendiri.
// Sesi login disimpan backend sebagai cookie httpOnly; frontend hanya
// mengirim cookie CSRF sebagai header X-CSRF-Token.
// ============================================================
import axios from "axios";

const api = axios.create({
  // Saat dev, biarkan kosong → request lewat proxy Vite (/api → localhost:5001).
  // Saat production, /api di-rewrite Vercel ke Railway (same-origin).
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const NAMA_COOKIE_CSRF = "vitara_csrf=";
const METODE_AMAN = ["get", "head", "options"];

function bacaCsrf() {
  const baris = String(document.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(NAMA_COOKIE_CSRF));
  return baris ? decodeURIComponent(baris.slice(NAMA_COOKIE_CSRF.length)) : "";
}

async function pastikanCsrf() {
  let token = bacaCsrf();
  if (token) return token;
  await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/csrf`, {
    credentials: "include",
    cache: "no-store",
  });
  return bacaCsrf();
}

// Interceptor request: cookie sesi dikirim browser otomatis, cukup
// tambahkan header CSRF untuk metode yang mengubah data.
api.interceptors.request.use(async (config) => {
  const metode = String(config.method || "get").toLowerCase();
  if (!METODE_AMAN.includes(metode)) {
    const csrf = await pastikanCsrf();
    if (csrf) config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

// Interceptor 401: sesi tidak valid → bersihkan cache profil & tendang ke login.
// Endpoint login/register yang gagal TIDAK boleh menendang ke /login,
// karena user belum punya sesi dan halaman harus tetap menampilkan pesan errornya.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const adalahEndpointAuth =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/oauth");
    if (error.response?.status === 401 && !adalahEndpointAuth) {
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("vitara-user-changed"));
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

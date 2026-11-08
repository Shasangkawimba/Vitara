// ============================================================
// services/api.js — Standar bersama seluruh anggota VITARA.
// Semua request API frontend WAJIB lewat instance axios ini
// (aturan teknis di AGENTS.md). Jangan buat axios.create() sendiri.
// ============================================================
import axios from "axios";

const api = axios.create({
  // Saat dev, biarkan kosong → request lewat proxy Vite (/api → localhost:5000).
  // Saat production, set VITE_API_URL di .env client, mis. https://api.vitara.com/api
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor request: tempel JWT dari localStorage jika ada (diset P1 saat login).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor 401: token tidak valid → bersihkan & tendang ke halaman login.
// CATATAN P1: pastikan key "token" ini sama dengan yang dipakai saat menyimpan JWT.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

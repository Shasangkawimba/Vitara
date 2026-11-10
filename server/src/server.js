// ============================================================
// server.js — Titik masuk backend VITARA.
// Minggu 1: minimal, hanya mount routes/ai.js milik P2.
// Route auth & logs (P1), dashboard (P3), utility (P4)
// akan ditambahkan pemiliknya masing-masing.
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());

// Endpoint Utama / Root & Health Check
app.get(["/", "/api"], (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      nama: "VITARA Backend API Server",
      status: "Berjalan normal",
      pesan: "Gunakan endpoint sesuai spesifikasi di API_CONTRACT.md",
      endpoints: {
        auth: [
          "POST /api/auth/register (Daftar akun baru)",
          "POST /api/auth/login (Masuk & dapatkan JWT token)",
          "GET /api/auth/me (Profil pengguna yang sedang login)",
        ],
        logs: [
          "GET /api/logs (Daftar histori log kerja & kesehatan)",
          "POST /api/logs (Catat log harian baru)",
          "POST /api/logs/quick-log (Duplikasi log kemarin)",
        ],
        ai: [
          "POST /api/ai/coach (Konsultasi keluhan dengan AI)",
          "GET /api/ai/risk-score (Skor risiko harian)",
          "GET /api/ai/weekly-insight (Ringkasan mingguan)",
        ],
      },
    },
  });
});

// Routes milik P1 (Auth & Work-Health Logger)
// Didukung dengan prefix /api dan fallback langsung tanpa /api
const authRoutes = require("./routes/auth");
const logsRoutes = require("./routes/logs");
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/logs", logsRoutes);

// Routes milik P2 (AI Engine)
const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);
app.use("/ai", aiRoutes);

// Routes milik P3 (Dashboard & Analytics)
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);
app.use("/dashboard", dashboardRoutes);

// Routes milik P4 (Utility: Finder & Pharmacy)
const pharmacyRoutes = require("./routes/pharmacy");
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/pharmacy", pharmacyRoutes);

// 404 → format standar sesuai API_CONTRACT.md dengan info URL detail
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan. Periksa kembali endpoint di API_CONTRACT.md.`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server VITARA berjalan di http://localhost:${PORT}`);
});

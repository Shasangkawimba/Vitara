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

// Percaya satu lapis proxy (Railway/Vercel) agar req.ip = IP klien sebenarnya.
app.set("trust proxy", 1);

// Header keamanan dasar. CSP sengaja belum dipasang karena frontend
// memakai font & peta eksternal; tambahkan setelah domain aset dipastikan.
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

// Pembatas laju sederhana di memori, tanpa dependensi baru.
// Cukup untuk satu instance; pindah ke Redis bila server di-scale horizontal.
const catatanLaju = new Map();
function pembatasLaju({ jendelaMs, maks, pesan }) {
  return (req, res, next) => {
    const kunci = `${req.ip}|${req.baseUrl || req.path}`;
    const sekarang = Date.now();
    const aktif = (catatanLaju.get(kunci) || []).filter(
      (t) => sekarang - t < jendelaMs
    );
    if (aktif.length >= maks) {
      res.set("Retry-After", String(Math.ceil(jendelaMs / 1000)));
      return res.status(429).json({ success: false, error: pesan });
    }
    aktif.push(sekarang);
    catatanLaju.set(kunci, aktif);
    next();
  };
}

// CSRF double-submit untuk semua perubahan data di /api.
// Cookie sesi httpOnly + SameSite=Lax melengkapi pemeriksaan ini.
const { validasiCsrf } = require("./middlewares/csrfMiddleware");
app.use("/api", validasiCsrf);

// Middleware dasar
// CORS produksi: batasi hanya ke domain frontend di ALLOWED_ORIGIN (pisah koma).
// Bila belum diset, perilaku lama (terbuka) dipertahankan agar tidak merusak
// anggota tim lain. Request tanpa header Origin (curl, health check,
// server-to-server) selalu diizinkan.
const asalDiizinkan = String(process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions = {
  credentials: true,
  origin: (asal, cb) => {
    if (!asal) return cb(null, true); // tanpa Origin: curl / health check / antar-server
    if (asalDiizinkan.length === 0) return cb(null, true); // belum dibatasi
    if (asalDiizinkan.includes(asal)) return cb(null, true);
    return cb(null, false); // asal tidak terdaftar: tanpa header ACAO / preflight 403
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// Batasi percobaan auth (login/register/OAuth) & konsumsi AI per IP.
app.use(
  "/api/auth",
  pembatasLaju({
    jendelaMs: 60_000,
    maks: 30,
    pesan: "Terlalu banyak permintaan login/daftar. Coba lagi dalam satu menit.",
  })
);
app.use(
  "/api/ai",
  pembatasLaju({
    jendelaMs: 60_000,
    maks: 40,
    pesan: "Terlalu banyak permintaan AI. Tunggu sebentar lalu coba lagi.",
  })
);

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
          "PUT /api/auth/me (Perbarui profil pengguna)",
          "GET /api/auth/oauth/google/start (Masuk dengan Google)",
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
          "GET /api/ai/history (Riwayat konsultasi user)",
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

// Routes milik P4 (Utility: Finder & Pharmacy & Reminders)
const pharmacyRoutes = require("./routes/pharmacy");
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/pharmacy", pharmacyRoutes);

const reminderRoutes = require("./routes/reminders");
app.use("/api/reminders", reminderRoutes);
app.use("/reminders", reminderRoutes);

const pushRoutes = require("./routes/push");
app.use("/api/push", pushRoutes);

// Health check untuk Railway / monitoring eksternal.
app.get(["/health", "/api/health"], async (_req, res) => {
  const memori = process.memoryUsage();
  try {
    const prisma = require("./lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      data: {
        status: "ok",
        database: "ok",
        uptimeDetik: Math.round(process.uptime()),
        memoriMB: Math.round(memori.rss / 1024 / 1024),
      },
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "Database tidak dapat dijangkau.",
    });
  }
});

// 404 → format standar sesuai API_CONTRACT.md dengan info URL detail
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan. Periksa kembali endpoint di API_CONTRACT.md.`,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server VITARA berjalan di http://localhost:${PORT}`);
  // Alarm dari server hanya aktif bila kunci VAPID sudah dikonfigurasi.
  const { startPushScheduler } = require("./services/pushScheduler");
  startPushScheduler();
});

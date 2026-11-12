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

// Routes milik P2 (AI Engine)
const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);

// Routes milik P3 (Dashboard & Analytics)
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// Routes milik P4 (Utility: Finder & Pharmacy & Reminders)
const pharmacyRoutes = require("./routes/pharmacy");
app.use("/api/pharmacy", pharmacyRoutes);

const reminderRoutes = require("./routes/reminders");
app.use("/api/reminders", reminderRoutes);

// Route Root (Health Check & Info)
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Server API VITARA berjalan dengan baik.",
    endpoints: [
      "/api/reminders",
      "/api/pharmacy",
      "/api/dashboard",
      "/api/ai"
    ]
  });
});

// 404 → format standar sesuai API_CONTRACT.md
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint tidak ditemukan." });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server VITARA berjalan di http://localhost:${PORT}`);
});

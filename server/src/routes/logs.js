// ============================================================
// server/src/routes/logs.js
// Router API Pencatatan Jam Kerja & Kesehatan (WorkLog).
// Sesuai dengan spesifikasi API_CONTRACT.md & standar AGENTS.md.
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
const express = require("express");
const { z } = require("zod");
const logService = require("../services/logService");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Semua endpoint logs memerlukan autentikasi JWT
router.use(authenticateToken);

// Skema Validasi Input Log Baru menggunakan Zod
const createLogSchema = z.object({
  workHours: z
    .number({ required_error: "Durasi jam kerja wajib diisi." })
    .int("Durasi jam kerja harus berupa bilangan bulat.")
    .min(1, "Durasi jam kerja minimal 1 jam.")
    .max(24, "Durasi jam kerja maksimal 24 jam sehari."),
  income: z
    .number()
    .int("Penghasilan harus berupa bilangan bulat.")
    .nonnegative("Penghasilan tidak boleh bernilai negatif.")
    .nullable()
    .optional(),
  symptoms: z
    .array(z.string().trim().min(1, "Keluhan tidak boleh kosong."))
    .optional()
    .default([]),
});

/**
 * GET /api/logs
 * Mengambil daftar seluruh riwayat log milik user yang sedang login
 */
router.get("/", async (req, res) => {
  try {
    const logs = await logService.getUserLogs(req.user.id);
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal memuat histori log kesehatan.",
    });
  }
});

/**
 * POST /api/logs
 * Membuat entri catatan log harian baru
 */
router.post("/", async (req, res) => {
  try {
    // 1. Validasi input dengan Zod
    const validationResult = createLogSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || "Data input log tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

    // 2. Simpan ke database melalui logService
    const newLog = await logService.createLog(req.user.id, validationResult.data);

    return res.status(201).json({
      success: true,
      data: newLog,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal menyimpan catatan log harian.",
    });
  }
});

/**
 * POST /api/logs/quick-log
 * Duplikasi log terakhir (Sama Seperti Kemarin) untuk pengisian super cepat (<30 detik)
 */
router.post("/quick-log", async (req, res) => {
  try {
    const duplicatedLog = await logService.createQuickLog(req.user.id);

    return res.status(201).json({
      success: true,
      data: duplicatedLog,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal membuat Quick Log.",
    });
  }
});

/**
 * GET /api/logs/quick-log
 * Panduan jika user memanggil via GET
 */
router.get("/quick-log", (_req, res) => {
  return res.status(405).json({
    success: false,
    error: "Method GET tidak didukung untuk quick-log. Silakan kirimkan request dengan method POST.",
  });
});

module.exports = router;


// ============================================================
// server/src/routes/logs.js
// Router API CRUD Pencatatan Jam Kerja & Kesehatan (WorkLog).
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

// Skema Validasi Input Log Baru menggunakan Zod (Sesuai P1_PRIVATE.md: jam 0-24, pendapatan >= 0)
const createLogSchema = z.object({
  workHours: z
    .number({ required_error: "Durasi jam kerja wajib diisi." })
    .int("Durasi jam kerja harus berupa bilangan bulat.")
    .min(0, "Durasi jam kerja minimal 0 jam (hari libur/istirahat).")
    .max(24, "Durasi jam kerja maksimal 24 jam sehari."),
  income: z
    .number()
    .int("Penghasilan harus berupa bilangan bulat.")
    .min(0, "Penghasilan tidak boleh bernilai negatif.")
    .nullable()
    .optional(),
  symptoms: z
    .array(z.string().trim().min(1, "Keluhan tidak boleh kosong."))
    .transform((items) => Array.from(new Set(items)))
    .optional()
    .default([]),
});

// Skema Validasi Pembaruan Log (semua field opsional tapi jika ada harus valid)
const updateLogSchema = z.object({
  workHours: z
    .number()
    .int("Durasi jam kerja harus berupa bilangan bulat.")
    .min(0, "Durasi jam kerja minimal 0 jam (hari libur/istirahat).")
    .max(24, "Durasi jam kerja maksimal 24 jam sehari.")
    .optional(),
  income: z
    .number()
    .int("Penghasilan harus berupa bilangan bulat.")
    .min(0, "Penghasilan tidak boleh bernilai negatif.")
    .nullable()
    .optional(),
  symptoms: z
    .array(z.string().trim().min(1, "Keluhan tidak boleh kosong."))
    .transform((items) => Array.from(new Set(items)))
    .optional(),
});

/**
 * GET /api/logs
 * Mengambil daftar riwayat log milik user yang sedang login
 * Query params opsional: ?limit=7&startDate=2026-11-01&endDate=2026-11-10
 */
router.get("/", async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const filter = {
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
    };
    const logs = await logService.getUserLogs(req.user.id, filter);
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
 * GET /api/logs/latest
 * Mengambil satu log terakhir untuk preview kartu Quick Log
 */
router.get("/latest", async (req, res) => {
  try {
    const latestLog = await logService.getLatestLog(req.user.id);
    return res.status(200).json({
      success: true,
      data: latestLog,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal mengambil log terakhir.",
    });
  }
});

/**
 * GET /api/logs/:id
 * Mengambil satu log spesifik berdasarkan ID
 */
router.get("/:id", async (req, res) => {
  try {
    const log = await logService.getLogById(req.user.id, req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Catatan log tidak ditemukan.",
      });
    }
    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal mengambil rincian log.",
    });
  }
});

/**
 * POST /api/logs
 * Membuat entri catatan log harian baru
 */
router.post("/", async (req, res) => {
  try {
    const validationResult = createLogSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || "Data input log tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

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
 * PUT /api/logs/:id
 * Memperbarui catatan log harian yang ada
 */
router.put("/:id", async (req, res) => {
  try {
    const validationResult = updateLogSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || "Data pembaruan log tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

    const updatedLog = await logService.updateLog(
      req.user.id,
      req.params.id,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      data: updatedLog,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal memperbarui catatan log.",
    });
  }
});

/**
 * DELETE /api/logs/:id
 * Menghapus catatan log harian
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedLog = await logService.deleteLog(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      data: {
        id: deletedLog.id,
        message: "Catatan log berhasil dihapus.",
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal menghapus catatan log.",
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

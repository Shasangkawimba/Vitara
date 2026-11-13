// ============================================================
// server/src/routes/dashboard.js
// Router API Dashboard VITARA (Milik P3)
// Sesuai dengan spesifikasi di API_CONTRACT.md dan aturan validasi Zod
// ============================================================
const express = require("express");
const router = express.Router();
const analyticsService = require("../services/analyticsService");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Seluruh endpoint Dashboard WAJIB terautentikasi JWT (isolasi data pengguna)
router.use(authenticateToken);

// Validasi query parameter menggunakan Zod secara aman (fallback jika zod belum di-install)
let z;
try {
  z = require("zod");
} catch (e) {
  z = null;
}

const dashboardQuerySchema = z
  ? z.object({
      days: z.coerce.number().int().positive().default(7),
    })
  : null;

const validateQuery = (query) => {
  if (dashboardQuerySchema) {
    const parsed = dashboardQuerySchema.safeParse(query);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Format query parameter tidak valid." };
    }
    return { data: parsed.data };
  }
  return {
    data: {
      days: Number(query.days) || 7,
    },
  };
};

/**
 * GET /api/dashboard/summary
 * Mengembalikan ringkasan total jam kerja, rata-rata pendapatan, dan keluhan
 */
router.get("/summary", async (req, res) => {
  try {
    const { data, error } = validateQuery(req.query);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    // userId HARUS murni berasal dari payload JWT yang sudah diverifikasi oleh middleware
    const userId = req.user.id;
    const summaryData = await analyticsService.getDashboardSummary(userId, data.days);
    return res.json({ success: true, data: summaryData });
  } catch (err) {
    console.error("[routes/dashboard] Error pada /summary:", err);
    return res.status(500).json({
      success: false,
      error: "Gagal mengambil data ringkasan dashboard.",
    });
  }
});

/**
 * GET /api/dashboard/correlation
 * Mengembalikan data relasi jam kerja vs keluhan fisik untuk visualisasi grafik
 */
router.get("/correlation", async (req, res) => {
  try {
    const { data, error } = validateQuery(req.query);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const userId = req.user.id;
    const correlationData = await analyticsService.getCorrelationData(userId, data.days);
    return res.json({ success: true, data: correlationData });
  } catch (err) {
    console.error("[routes/dashboard] Error pada /correlation:", err);
    return res.status(500).json({
      success: false,
      error: "Gagal mengambil data korelasi.",
    });
  }
});

/**
 * GET /api/dashboard/trend
 * Mengembalikan data tren keluhan dan durasi kerja
 */
router.get("/trend", async (req, res) => {
  try {
    const { data, error } = validateQuery(req.query);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const userId = req.user.id;
    const trendData = await analyticsService.getTrendData(userId, data.days);
    return res.json({ success: true, data: trendData });
  } catch (err) {
    console.error("[routes/dashboard] Error pada /trend:", err);
    return res.status(500).json({
      success: false,
      error: "Gagal mengambil data tren keluhan.",
    });
  }
});

module.exports = router;

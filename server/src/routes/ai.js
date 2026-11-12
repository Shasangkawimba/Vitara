// ============================================================
// routes/ai.js — Milik P2 (Ergo-Coach AI)
// Endpoint resmi AI Engine sesuai API_CONTRACT.md:
//   POST /api/ai/coach        → konsultasi keluhan (Minggu 2)
//   GET  /api/ai/risk-score   → skor risiko kelelahan 0-100 (Minggu 3)
//   GET  /api/ai/weekly-insight → ringkasan evaluasi mingguan (Minggu 4)
//   GET  /api/ai/status       → cek kesiapan layanan AI
// ============================================================
const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { analyzeComplaint, hitungSkorRisiko, buatInsightMingguan, MODEL_NAME, DISCLAIMER } = require("../services/aiService");

const router = express.Router();

// Skema validasi input keluhan.
// `pesan` adalah field resmi; `message`/`keluhan` diterima sebagai alias
// agar frontend lain (P3/P4) tidak gagal saat memakai nama berbeda.
const coachSchema = z.object({
  pesan: z
    .string({ required_error: "Pesan keluhan wajib diisi." })
    .trim()
    .min(3, "Pesan keluhan minimal 3 karakter.")
    .max(1000, "Pesan keluhan maksimal 1000 karakter."),
});

/**
 * Ambil WorkLog milik user dari rentang hari terakhir.
 * Kegagalan database TIDAK boleh menggagalkan konsultasi AI — bila gagal,
 * kita lanjut dengan array kosong (mode Konservatif) sambil mencatat warning.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} [params.hari=7]  Cakupan hari ke belakang.
 * @param {number} [params.maks=7]  Batas jumlah baris yang diambil.
 * @returns {Promise<{ logs: Array, dbError: string|null }>}
 */
async function ambilWorkLog({ userId, hari = 7, maks = 7 }) {
  try {
    const batasWaktu = new Date();
    batasWaktu.setDate(batasWaktu.getDate() - hari);

    const logs = await prisma.workLog.findMany({
      where: {
        userId,
        createdAt: { gte: batasWaktu },
      },
      orderBy: { createdAt: "desc" },
      take: maks,
      select: {
        id: true,
        workHours: true,
        income: true,
        symptoms: true,
        createdAt: true,
      },
    });

    return { logs, dbError: null };
  } catch (err) {
    console.error("[routes/ai] Gagal mengambil WorkLog:", err?.message || err);
    return { logs: [], dbError: err?.message || "Gagal mengambil histori log." };
  }
}

/** WorkLog 7 hari terakhir untuk /coach dan /risk-score. */
const ambilWorkLogTerakhir = (userId) => ambilWorkLog({ userId, hari: 7, maks: 7 });

/** WorkLog 14 hari terakhir untuk /weekly-insight (dibandingkan 7 vs 7). */
const ambilWorkLogDuaMinggu = (userId) => ambilWorkLog({ userId, hari: 14, maks: 60 });

/**
 * Simpan hasil konsultasi ke tabel AiInteraction.
 * Kegagalan simpan tidak membatalkan respons ke user (non-fatal).
 *
 * @returns {Promise<{ saved: boolean, id: string|null }>}
 */
async function simpanInteraksi({ userId, pesanUser, responsAi, isEmergency }) {
  try {
    const row = await prisma.aiInteraction.create({
      data: {
        userId,
        pesanUser,
        responsAi,
        isEmergency,
      },
      select: { id: true },
    });
    return { saved: true, id: row.id };
  } catch (err) {
    console.error("[routes/ai] Gagal menyimpan AiInteraction:", err?.message || err);
    return { saved: false, id: null };
  }
}

// GET /api/ai/status → cek cepat apakah layanan AI siap (tanpa memanggil LLM)
router.get("/status", (_req, res) => {
  res.json({
    success: true,
    data: {
      model: MODEL_NAME,
      siap: Boolean(process.env.GEMINI_API_KEY),
      modeTersedia: ["KONSERVATIF", "TRANSISI", "POLA_LENGKAP", "DARURAT"],
      disclaimer: DISCLAIMER,
    },
  });
});

// POST /api/ai/coach → analisis keluhan user berbasis 7 WorkLog terakhir
router.post("/coach", authenticateToken, async (req, res) => {
  // 1. Validasi input dengan zod
  const body = {
    pesan: req.body?.pesan ?? req.body?.message ?? req.body?.keluhan,
  };
  const validasi = coachSchema.safeParse(body);

  if (!validasi.success) {
    return res.status(400).json({
      success: false,
      error: validasi.error.issues[0]?.message || "Input keluhan tidak valid.",
    });
  }

  const pesanUser = validasi.data.pesan;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Sesi tidak valid. Silakan login ulang.",
    });
  }

  // 2. Ambil histori WorkLog 7 hari terakhir (non-fatal bila DB bermasalah)
  const { logs, dbError } = await ambilWorkLogTerakhir(userId);

  // 3. Analisis: guardrails keyword darurat → tanpa LLM; selain itu → LLM
  let hasil;
  try {
    hasil = await analyzeComplaint({
      userMessage: pesanUser,
      logs,
      userName: req.user?.name,
    });
  } catch (err) {
    console.error("[routes/ai] Gagal menganalisis keluhan:", err?.message || err);
    return res.status(502).json({
      success: false,
      error: "Gagal menghubungi layanan AI. Periksa koneksi lalu coba lagi.",
    });
  }

  // 4. Simpan ke AiInteraction (responsAi berisi JSON lengkap hasil analisis)
  const dataSimpan = {
    analisis: hasil.analisis,
    rencana_pemulihan: hasil.rencana_pemulihan,
    saran_otc: hasil.saran_otc,
    peringatan: hasil.peringatan,
    disclaimer: hasil.disclaimer,
    mode: hasil.mode,
    modeLabel: hasil.modeLabel,
    isEmergency: hasil.isEmergency,
  };
  const simpan = await simpanInteraksi({
    userId,
    pesanUser,
    responsAi: dataSimpan,
    isEmergency: Boolean(hasil.isEmergency),
  });

  // 5. Respons standar { success, data }
  return res.json({
    success: true,
    data: {
      ...hasil,
      interaksiId: simpan.id,
      tersimpan: simpan.saved,
      peringatanSistem: dbError
        ? "Histori log gagal dibaca, analisis memakai mode Konservatif."
        : undefined,
    },
  });
});

// GET /api/ai/risk-score → skor risiko kelelahan 0-100 (deterministik, tanpa LLM)
router.get("/risk-score", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Sesi tidak valid. Silakan login ulang.",
    });
  }

  // WorkLog 7 hari terakhir; kegagalan DB → skor tetap dibalas (null) + pesan sistem
  const { logs, dbError } = await ambilWorkLogTerakhir(userId);
  const hasil = hitungSkorRisiko(logs);

  return res.json({
    success: true,
    data: {
      ...hasil,
      periode: { hari: 7, cakupan: "7 hari terakhir" },
      disclaimer: DISCLAIMER,
      peringatanSistem: dbError
        ? "Histori log gagal dibaca, skor dihitung tanpa data."
        : undefined,
    },
  });
});

// GET /api/ai/weekly-insight → ringkasan evaluasi 14 hari (deterministik, tanpa LLM)
router.get("/weekly-insight", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Sesi tidak valid. Silakan login ulang.",
    });
  }

  const { logs, dbError } = await ambilWorkLogDuaMinggu(userId);
  const hasil = buatInsightMingguan(logs);

  return res.json({
    success: true,
    data: {
      ...hasil,
      periode: { hari: 14, cakupan: "14 hari terakhir" },
      peringatanSistem: dbError
        ? "Histori log gagal dibaca, ringkasan ditampilkan tanpa data."
        : undefined,
    },
  });
});

module.exports = router;

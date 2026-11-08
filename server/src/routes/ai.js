// ============================================================
// routes/ai.js — Milik P2 (Ergo-Coach AI)
// Minggu 1: hanya endpoint test. Endpoint resmi sesuai
// API_CONTRACT.md (/api/ai/coach, /api/ai/risk-score,
// /api/ai/weekly-insight) akan diisi Minggu 2-4.
// ============================================================
const express = require("express");
const router = express.Router();
const { invokeLLM, MODEL_NAME } = require("../services/aiService");

// GET /api/ai/status → cek cepat apakah server AI hidup ( gratis, tanpa LLM )
router.get("/status", (_req, res) => {
  res.json({ success: true, data: { model: MODEL_NAME, siap: Boolean(process.env.GEMINI_API_KEY) } });
});

// POST /api/ai/test-llm → kirim teks bebas ke Gemini untuk mengetes koneksi.
// CATATAN: endpoint ini HANYA untuk uji Minggu 1. Sebelum endpoint resmi
// /api/ai/coach aktif, baris ini WAJIB dihapus atau API_CONTRACT.md diupdate.
router.post("/test-llm", async (req, res) => {
  try {
    const prompt = req.body?.prompt || "Sebut model apa yang kamu gunakan, satu kalimat.";
    const jawaban = await invokeLLM(prompt);
    res.json({ success: true, data: { model: MODEL_NAME, jawaban } });
  } catch (err) {
    console.error("[routes/ai] Gagal memanggil LLM:", err?.message || err);
    res.status(502).json({ success: false, error: "Gagal menghubungi layanan AI. Coba lagi nanti." });
  }
});

module.exports = router;

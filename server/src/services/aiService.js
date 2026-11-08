// ============================================================
// aiService.js — Milik P2 (Ergo-Coach AI)
// Setup LangChain + Google Gemini 2.0 Flash.
// Minggu 1: fokus inisialisasi model dan fungsi invokeLLM(prompt)
// untuk mengetes koneksi ke Gemini API.
// ============================================================
require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

// Nama model default. Catatan (Nov 2026): "gemini-2.0-flash" sudah
// DI-PENSIUNKAN Google (HTTP 404 "no longer available"). Kita pakai
// generasi terbaru gemini-3.8-flash; masih bisa dioverride lewat env
// GEMINI_MODEL. Alternatif aktif lain: gemini-3.6-flash, gemini-2.5-flash.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// API key diambil dari environment variable GEMINI_API_KEY.
// Jika tidak ada, kita lempar error yang jelas agar mudah didebug.
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error(
    "[aiService] GEMINI_API_KEY belum diisi. Salin server/.env.example menjadi server/.env lalu isi API key."
  );
}

// ===
// Inisialisasi LangChain dengan model Gemini 2.0 Flash
// ===
const llm = new ChatGoogleGenerativeAI({
  apiKey, // eksplisit agar tidak bergantung pada nama env tertentu
  model: MODEL_NAME,
  temperature: 1.0, // WAJIB 1.0 untuk Gemini 3.0+ (nilai 0.7 bisa bikin reasoning turun / infinite loop menurut docs Google)
  maxRetries: 2, // Gemini kadang 429/503 saat beban tinggi
});

/**
 * Kirim satu prompt teks ke LLM dan kembalikan jawaban mentah (string).
 *
 * Catatan Minggu 2+: fungsi ini nantinya dibungkus oleh fungsi lain yang:
 *  1. Mengambil 7 log terakhir tabel WorkLog (Prisma) untuk konteks analisis.
 *  2. Memanggil detectEmergencyKeyword() SEBELUM LLM dipanggil.
 *  3. Mem-parse output LLM menjadi JSON dengan struktur:
 *     { analisis, rencana_pemulihan, saran_otc, peringatan, disclaimer }
 *
 * @param {string} prompt - Teks prompt lengkap yang sudah siap dikirim.
 * @returns {Promise<string>} Jawaban teks mentah dari model.
 */
async function invokeLLM(prompt) {
  const jawaban = await llm.invoke(prompt);
  // ai (AIMessage) → ambil properti content sebagai string
  return typeof jawaban.content === "string"
    ? jawaban.content
    : JSON.stringify(jawaban.content);
}

module.exports = {
  llm,
  invokeLLM,
  MODEL_NAME,
};

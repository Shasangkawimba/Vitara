// ============================================================
// testLlm.js — Script satu kali jalan untuk mengetes koneksi
// Gemini API. Loop "npm run test:llm" di folder server/.
// ============================================================
const { invokeLLM, MODEL_NAME } = require("../services/aiService");

async function main() {
  console.log(`Mengetes model: ${MODEL_NAME}`);
  try {
    const jawaban = await invokeLLM(
      "Balas dengan satu kalimat saja dalam Bahasa Indonesia: jika kamu membaca pesan ini, koneksi Gemini API berhasil."
    );
    console.log("=== JAWABAN GEMINI ===");
    console.log(jawaban);
    console.log("Koneksi berhasil. Lanjut ke tugas Minggu 2.");
  } catch (err) {
    console.error("=== GAGAL ===");
    console.error(err?.message || err);
    process.exitCode = 1;
  }
}

main();

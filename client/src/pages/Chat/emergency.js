// ============================================================
// client/src/pages/Chat/emergency.js
// Deteksi keyword darurat di sisi CLIENT (Milik P2).
//
// Catatan: daftar ini HARUS sinkron dengan EMERGENCY_KEYWORDS di
// server/src/services/aiService.js. Deteksi di sini hanya untuk
// menampilkan banner 119 lebih cepat (tanpa menunggu server);
// keputusan final tetap dari server via isEmergency.
// ============================================================

const KEYWORD_DARURAT = [
  "nyeri dada",
  "nyeri di dada",
  "dada terasa nyeri",
  "sesak napas",
  "sesak nafas",
  "pingsan",
];

/**
 * Deteksi keyword darurat pada teks keluhan.
 * @param {string} teks
 * @returns {string[]} Daftar keyword yang cocok (kosong bila aman).
 */
const deteksiDarurat = (teks = "") => {
  const normal = String(teks).toLowerCase();
  return KEYWORD_DARURAT.filter((keyword) => normal.includes(keyword));
};

export default deteksiDarurat;

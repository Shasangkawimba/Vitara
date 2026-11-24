// ============================================================
// server/src/constants/password.js
// Aturan kata sandi minimum tanpa dependensi tambahan.
// ============================================================

/** @returns {string|null} Pesan error, atau null bila kuat. */
function validasiKataSandi(nilai) {
  const sandi = String(nilai || "");
  if (sandi.length < 6) return "Kata sandi minimal 6 karakter.";
  if (sandi.length > 72) return "Kata sandi maksimal 72 karakter.";
  if (!/[a-zA-Z]/.test(sandi)) return "Kata sandi harus berisi huruf.";
  if (!/[0-9]/.test(sandi)) return "Kata sandi harus berisi angka.";
  return null;
}

module.exports = { validasiKataSandi };

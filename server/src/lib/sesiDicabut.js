// ============================================================
// server/src/lib/sesiDicabut.js
// Daftar JWT yang sudah logout, sampai masa berlakunya habis.
// Cukup untuk satu instance; pindah ke Redis bila server di-scale.
// ============================================================
const dicabut = new Map(); // jti → kedaluwarsa (ms)

function cabutSesi(jti, kedaluwarsaMs) {
  if (!jti) return;
  dicabut.set(jti, kedaluwarsaMs || Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function sesiDicabut(jti) {
  if (!jti) return false;
  const kedaluwarsa = dicabut.get(jti);
  if (!kedaluwarsa) return false;
  if (kedaluwarsa < Date.now()) {
    dicabut.delete(jti);
    return false;
  }
  return true;
}

module.exports = { cabutSesi, sesiDicabut };

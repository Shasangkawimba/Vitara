// ============================================================
// server/src/constants/symptoms.js
// Daftar keluhan kanonik VITARA. Label ini yang disimpan di WorkLog
// dan ditampilkan di Logger/Dashboard, jadi tidak ada migrasi data.
// ============================================================

const GEJALA = [
  {
    label: "Sakit Pinggang",
    area: "Pinggang (Lumbal)",
    kata: ["pinggang", "punggung", "lumbal", "boyok", "encok"],
  },
  {
    label: "Leher & Bahu",
    area: "Bahu & Leher",
    kata: ["leher", "bahu", "pundak", "tengeng", "kaku bahu"],
  },
  {
    label: "Lutut & Kaki",
    area: "Lutut & Kaki",
    kata: ["lutut", "kaki", "betis", "paha", "dengkul"],
  },
  {
    label: "Pergelangan",
    area: "Pergelangan & Tangan",
    kata: ["pergelangan", "tangan", "jari", "jempol", "kebas"],
  },
  {
    label: "Mata Lelah",
    area: "Mata",
    kata: ["mata", "silau", "sepet", "kabur"],
  },
  {
    label: "Pusing Kepala",
    area: "Kepala",
    kata: ["pusing", "kepala", "migrain", "pening"],
  },
];

const LABEL_SEHAT = "Bebas Keluhan & Bugar";

const areaDariNama = (nama) => {
  const teks = String(nama || "").toLowerCase();
  for (const g of GEJALA) {
    if (g.kata.some((k) => teks.includes(k))) return g.area;
  }
  return "Lainnya";
};

/**
 * Ubah keluhan bebas (termasuk data lama/suara) ke label kanonik.
 * "Bebas Keluhan & Bugar" dibuang karena bukan keluhan.
 */
function normalisasiGejala(items) {
  if (!Array.isArray(items)) return [];
  const hasil = [];
  for (const item of items) {
    const teks = String(item || "").trim();
    if (!teks) continue;
    const lower = teks.toLowerCase();
    if (lower.includes("bebas keluhan")) continue;
    const cocok =
      GEJALA.find((g) => g.label.toLowerCase() === lower) ||
      GEJALA.find((g) => g.kata.some((k) => lower.includes(k)));
    const label = cocok?.label || teks;
    if (!hasil.includes(label)) hasil.push(label);
  }
  return hasil;
}

module.exports = { GEJALA, LABEL_SEHAT, areaDariNama, normalisasiGejala };

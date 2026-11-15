// ============================================================
// server/src/services/analyticsService.js
// Business Logic Agregasi Metrik Dashboard VITARA (Milik P3)
// Menghitung SUM(workHours), AVG(income), COUNT(symptoms)
// Semua data diambil LANGSUNG dari database (Prisma) — tanpa data dummy.
// ============================================================
const prisma = require("../lib/prisma");

/**
 * Konversi tanggal ke nama hari Bahasa Indonesia (WIB).
 * @param {Date} tanggal
 */
function namaHariID(tanggal) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  }).format(tanggal);
}

/**
 * Kunci tanggal lokal (WIB) untuk pengelompokan per hari.
 * @param {Date} tanggal
 */
function kunciHariWIB(tanggal) {
  return new Intl.DateTimeFormat("en-CA", {
    // en-CA menghasilkan format YYYY-MM-DD
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tanggal);
}

/**
 * Mengambil ringkasan metrik dashboard (Total Jam, Rata-rata Pendapatan, Jumlah Keluhan)
 * Sesuai kontrak: GET /api/dashboard/summary
 * @param {string|number} userId - ID pengguna (wajib, dari JWT)
 * @param {number} days - Rentang hari (default 7 hari)
 */
async function getDashboardSummary(userId, days = 7) {
  const periodeHari = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodeHari);

  if (prisma && prisma.workLog) {
    const logs = await prisma.workLog.findMany({
      where: {
        userId: userId ? String(userId) : undefined,
        createdAt: { gte: startDate },
      },
    });

    const totalWorkHours = logs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);
    const validIncomeLogs = logs.filter(
      (item) => item.income !== null && item.income !== undefined
    );
    const avgIncome =
      logs.length > 0
        ? Math.round(
            validIncomeLogs.reduce((sum, item) => sum + Number(item.income), 0) / logs.length
          )
        : 0;

    // Hitung total keluhan (array atau string dipisah koma)
    const totalSymptoms = logs.reduce((count, item) => {
      if (Array.isArray(item.symptoms)) return count + item.symptoms.length;
      if (typeof item.symptoms === "string" && item.symptoms.trim()) {
        return count + item.symptoms.split(",").length;
      }
      return count;
    }, 0);

    // Tidak ada lagi data dummy: DB kosong = angka nol yang JUJUR
    return {
      totalWorkHours,
      avgIncome,
      totalSymptoms,
      totalLogs: logs.length,
      periodDays: periodeHari,
      isDemoData: false,
    };
  }

  // Prisma client belum tersedia (schema belum di-generate) — kembalikan nol, bukan angka palsu
  return {
    totalWorkHours: 0,
    avgIncome: 0,
    totalSymptoms: 0,
    totalLogs: 0,
    periodDays: periodeHari,
    isDemoData: false,
  };
}

/**
 * Mengambil data korelasi jam kerja vs keluhan fisik per hari (dari database).
 * Sesuai kontrak: GET /api/dashboard/correlation
 * @param {string|number} userId - ID pengguna (wajib, dari JWT)
 * @param {number} days - Rentang hari (default 7 hari)
 * @returns {Promise<Array<{hari, jamKerja, keluhan, pendapatan, isPuncak}>>} + distribusiKeluhan
 */
async function getCorrelationData(userId, days = 7) {
  const periodeHari = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodeHari);

  if (!prisma || !prisma.workLog) {
    return { hari: [], distribusiKeluhan: [], totalKeluhan: 0 };
  }

  const logs = await prisma.workLog.findMany({
    where: {
      userId: userId ? String(userId) : undefined,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "asc" },
  });

  // Kelompokkan log per hari (WIB)
  const perHari = new Map();
  const penghitungKeluhan = new Map();

  for (const log of logs) {
    const kunci = kunciHariWIB(new Date(log.createdAt));
    if (!perHari.has(kunci)) {
      perHari.set(kunci, {
        kunci,
        createdAt: new Date(log.createdAt),
        jamKerja: 0,
        keluhan: 0,
        pendapatan: 0,
      });
    }
    const entri = perHari.get(kunci);
    entri.jamKerja += Number(log.workHours) || 0;
    entri.pendapatan += Number(log.income) || 0;

    // Normalisasi keluhan: array → tiap item dihitung; string → dipisah koma
    let daftarKeluhan = [];
    if (Array.isArray(log.symptoms)) daftarKeluhan = log.symptoms;
    else if (typeof log.symptoms === "string" && log.symptoms.trim()) {
      daftarKeluhan = log.symptoms.split(",").map((s) => s.trim());
    }
    const keluhanValid = daftarKeluhan.filter(
      (k) => k && !k.toLowerCase().includes("bebas keluhan")
    );
    entri.keluhan += keluhanValid.length;
    keluhanValid.forEach((k) =>
      penghitungKeluhan.set(k, (penghitungKeluhan.get(k) || 0) + 1)
    );
  }

  // Susun array per hari, urut kronologis, tandai hari dengan jam terbanyak (puncak)
  const daftarHari = Array.from(perHari.values())
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((e) => ({
      hari: namaHariID(e.createdAt),
      tanggal: e.kunci,
      jamKerja: Math.round(e.jamKerja * 10) / 10,
      keluhan: e.keluhan,
      pendapatan: e.pendapatan,
      isPuncak: false,
    }));

  if (daftarHari.length > 0) {
    const puncak = daftarHari.reduce((a, b) => (b.jamKerja > a.jamKerja ? b : a));
    if (puncak.jamKerja > 0) puncak.isPuncak = true;
  }

  // Distribusi keluhan per area tubuh (dikelompokkan dari data nyata)
  const totalKeluhan = Array.from(penghitungKeluhan.values()).reduce((a, b) => a + b, 0);
  const pengelompokan = [
    { kunci: "Pinggang (Lumbal)", kata: ["pinggang", "punggung", "lumbal", "sakit pinggang"] },
    { kunci: "Bahu & Leher", kata: ["leher", "bahu", "pundak"] },
  ];
  const distribusiMap = new Map();
  for (const [nama, jumlah] of penghitungKeluhan) {
    const namaLower = nama.toLowerCase();
    let area = "Lainnya";
    for (const g of pengelompokan) {
      if (g.kata.some((k) => namaLower.includes(k))) {
        area = g.kunci;
        break;
      }
    }
    distribusiMap.set(area, (distribusiMap.get(area) || 0) + jumlah);
  }
  const distribusiKeluhan = Array.from(distribusiMap.entries())
    .map(([area, jumlah]) => ({
      area,
      jumlah,
      persen: totalKeluhan > 0 ? Math.round((jumlah / totalKeluhan) * 100) : 0,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return { hari: daftarHari, distribusiKeluhan, totalKeluhan };
}

/**
 * Mengambil data tren metrik 7 atau 30 hari (dari database).
 * Sesuai kontrak: GET /api/dashboard/trend
 */
async function getTrendData(userId, days = 7) {
  const periodeHari = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodeHari);

  if (!prisma || !prisma.workLog) {
    return { period: `${periodeHari} hari terakhir`, totalLogs: 0, totalJamKerja: 0, totalKeluhan: 0 };
  }

  const logs = await prisma.workLog.findMany({
    where: {
      userId: userId ? String(userId) : undefined,
      createdAt: { gte: startDate },
    },
  });

  const totalJamKerja = logs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);
  let totalKeluhan = 0;
  const penghitungKeluhan = new Map();
  for (const log of logs) {
    let daftar = Array.isArray(log.symptoms)
      ? log.symptoms
      : typeof log.symptoms === "string" && log.symptoms.trim()
      ? log.symptoms.split(",").map((s) => s.trim())
      : [];
    daftar = daftar.filter((k) => k && !k.toLowerCase().includes("bebas keluhan"));
    totalKeluhan += daftar.length;
    daftar.forEach((k) => penghitungKeluhan.set(k, (penghitungKeluhan.get(k) || 0) + 1));
  }
  const kategoriTerbanyak = Array.from(penghitungKeluhan.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nama]) => nama);

  return {
    period: `${periodeHari} hari terakhir`,
    totalLogs: logs.length,
    totalJamKerja,
    totalKeluhan,
    kategoriKeluhanTerbanyak: kategoriTerbanyak,
  };
}

module.exports = {
  getDashboardSummary,
  getCorrelationData,
  getTrendData,
};

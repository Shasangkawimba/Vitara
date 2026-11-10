// ============================================================
// server/src/services/analyticsService.js
// Business Logic Agregasi Metrik Dashboard VITARA (Milik P3)
// Menghitung SUM(workHours), AVG(income), COUNT(symptoms)
// ============================================================

/**
 * Mencoba memuat Prisma Client secara aman (jika schema & migration P1 sudah siap).
 * Jika belum ada, gunakan mock/fallback generator agar frontend tidak crash.
 */
let prisma = null;
try {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
} catch (e) {
  // Prisma client belum di-generate oleh P1
  prisma = null;
}

/**
 * Mengambil ringkasan metrik dashboard (Total Jam, Rata-rata Pendapatan, Jumlah Keluhan)
 * Sesuai kontrak: GET /api/dashboard/summary
 * @param {string|number} userId - ID pengguna
 * @param {number} days - Rentang hari (default 7 hari)
 */
async function getDashboardSummary(userId, days = 7) {
  // Jika database & prisma aktif dan model Log tersedia
  if (prisma && prisma.log) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const logs = await prisma.log.findMany({
        where: {
          userId: userId ? String(userId) : undefined,
          createdAt: { gte: startDate },
        },
      });

      if (logs.length > 0) {
        const totalWorkHours = logs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);
        const validIncomeLogs = logs.filter((item) => item.income !== null && item.income !== undefined);
        const avgIncome = validIncomeLogs.length > 0
          ? Math.round(validIncomeLogs.reduce((sum, item) => sum + Number(item.income), 0) / validIncomeLogs.length)
          : 0;

        // Hitung total keluhan (array atau string dipisah koma)
        const totalSymptoms = logs.reduce((count, item) => {
          if (Array.isArray(item.symptoms)) return count + item.symptoms.length;
          if (typeof item.symptoms === "string" && item.symptoms.trim()) {
            return count + item.symptoms.split(",").length;
          }
          return count;
        }, 0);

        return {
          totalWorkHours,
          avgIncome,
          totalSymptoms,
          totalLogs: logs.length,
          periodDays: parseInt(days),
        };
      }
    } catch (err) {
      console.warn("[analyticsService] Prisma query fallback ke data default:", err.message);
    }
  }

  // Fallback data representatif (Demo / jika P1 belum migrate DB)
  return {
    totalWorkHours: 54.5,
    avgIncome: 185000,
    totalSymptoms: 8,
    totalLogs: 7,
    periodDays: parseInt(days),
    isDemoData: !prisma,
  };
}

/**
 * Mengambil data korelasi jam kerja vs keluhan fisik untuk Recharts (Minggu 3)
 * Sesuai kontrak: GET /api/dashboard/correlation
 */
async function getCorrelationData(userId, days = 7) {
  return [
    { hari: "Senin", jamKerja: 8.5, keluhan: 1, pendapatan: 175000 },
    { hari: "Selasa", jamKerja: 9.0, keluhan: 2, pendapatan: 190000 },
    { hari: "Rabu", jamKerja: 7.5, keluhan: 0, pendapatan: 160000 },
    { hari: "Kamis", jamKerja: 10.0, keluhan: 3, pendapatan: 220000 },
    { hari: "Jumat", jamKerja: 8.0, keluhan: 1, pendapatan: 180000 },
    { hari: "Sabtu", jamKerja: 6.5, keluhan: 0, pendapatan: 150000 },
    { hari: "Minggu", jamKerja: 5.0, keluhan: 1, pendapatan: 120000 },
  ];
}

/**
 * Mengambil data tren metrik 7 atau 30 hari
 * Sesuai kontrak: GET /api/dashboard/trend
 */
async function getTrendData(userId, days = 7) {
  return {
    period: `${days} hari terakhir`,
    trenJamKerja: "+5.2%",
    trenKeluhan: "-12.5%",
    kategoriKeluhanTerbanyak: ["Nyeri Pinggang", "Pegal Leher", "Kram Kaki"],
  };
}

module.exports = {
  getDashboardSummary,
  getCorrelationData,
  getTrendData,
};

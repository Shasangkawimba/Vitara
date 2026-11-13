// ============================================================
// server/src/services/analyticsService.js
// Business Logic Agregasi Metrik Dashboard VITARA (Milik P3)
// Mengambil data aktual dari model WorkLog Prisma
// ============================================================
const prisma = require("../lib/prisma");

/**
 * Helper untuk mengekstrak dan memfilter keluhan fisik nyata.
 * Mengabaikan opsi "Bebas Keluhan & Bugar" agar tidak dihitung sebagai keluhan/sakit.
 * @param {Array|string} rawSymptoms
 * @returns {string[]}
 */
function extractRealSymptoms(rawSymptoms) {
  let list = [];
  if (Array.isArray(rawSymptoms)) {
    list = rawSymptoms;
  } else if (typeof rawSymptoms === "string" && rawSymptoms.trim()) {
    list = rawSymptoms.split(",").map((s) => s.trim());
  }

  return list.filter((s) => {
    if (!s || typeof s !== "string") return false;
    const lower = s.toLowerCase();
    return !lower.includes("bebas keluhan") && !lower.includes("bugar");
  });
}

/**
 * Mengambil ringkasan metrik dashboard (Total Jam, Rata-rata Pendapatan, Jumlah Keluhan)
 * Sesuai kontrak: GET /api/dashboard/summary
 * @param {string} userId - ID pengguna terautentikasi (wajib)
 * @param {number} days - Rentang hari (default 7 hari)
 */
async function getDashboardSummary(userId, days = 7) {
  if (!userId) {
    return {
      totalWorkHours: 0,
      avgIncome: 0,
      totalSymptoms: 0,
      totalLogs: 0,
      periodDays: parseInt(days) || 7,
      hasData: false,
    };
  }

  const periodDays = parseInt(days) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const whereClause = {
    userId: String(userId),
    createdAt: { gte: startDate },
  };

  const logs = await prisma.workLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  if (!logs || logs.length === 0) {
    return {
      totalWorkHours: 0,
      avgIncome: 0,
      totalSymptoms: 0,
      totalLogs: 0,
      periodDays,
      hasData: false,
    };
  }

  // 1. Total jam kerja
  const totalWorkHours = logs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);

  // 2. Rata-rata pendapatan dari log yang memiliki income
  const validIncomeLogs = logs.filter((item) => item.income !== null && item.income !== undefined);
  const avgIncome =
    validIncomeLogs.length > 0
      ? Math.round(
          validIncomeLogs.reduce((sum, item) => sum + Number(item.income), 0) /
            validIncomeLogs.length
        )
      : 0;

  // 3. Total keluhan dari array symptoms (Hanya keluhan fisik nyata)
  const totalSymptoms = logs.reduce((count, item) => {
    return count + extractRealSymptoms(item.symptoms).length;
  }, 0);

  return {
    totalWorkHours,
    avgIncome,
    totalSymptoms,
    totalLogs: logs.length,
    periodDays,
    hasData: true,
  };
}

/**
 * Mengambil data korelasi jam kerja vs keluhan fisik untuk Recharts (Minggu 3)
 * Sesuai kontrak: GET /api/dashboard/correlation
 * Dikelompokkan per tanggal aktual dalam rentang `days`
 * @param {string} userId
 * @param {number} days
 */
async function getCorrelationData(userId, days = 7) {
  if (!userId) {
    return [];
  }

  const periodDays = parseInt(days) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const whereClause = {
    userId: String(userId),
    createdAt: { gte: startDate },
  };

  const logs = await prisma.workLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  if (!logs || logs.length === 0) {
    return [];
  }

  // Kelompokkan data berdasarkan tanggal YYYY-MM-DD
  const groupedByDate = {};

  logs.forEach((item) => {
    const d = new Date(item.createdAt);
    const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayName = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d);
    const dayDate = `${dayName} (${d.getDate()}/${d.getMonth() + 1})`;

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        hari: dayDate,
        date: dateKey,
        jamKerja: 0,
        keluhan: 0,
        pendapatan: 0,
        incomeCount: 0,
      };
    }

    groupedByDate[dateKey].jamKerja += Number(item.workHours) || 0;

    // Hanya keluhan fisik nyata (Bebas Keluhan & Bugar tidak dihitung sebagai keluhan)
    const realSymptoms = extractRealSymptoms(item.symptoms);
    groupedByDate[dateKey].keluhan += realSymptoms.length;

    if (item.income !== null && item.income !== undefined) {
      groupedByDate[dateKey].pendapatan += Number(item.income);
      groupedByDate[dateKey].incomeCount += 1;
    }
  });

  // Urutkan berdasarkan tanggal ascending
  const sortedDates = Object.keys(groupedByDate).sort();
  return sortedDates.map((dateKey) => {
    const entry = groupedByDate[dateKey];
    return {
      hari: entry.hari,
      date: entry.date,
      jamKerja: Number(entry.jamKerja.toFixed(1)),
      keluhan: entry.keluhan,
      pendapatan: entry.pendapatan,
    };
  });
}

/**
 * Mengambil data tren metrik aktual dengan membandingkan periode sekarang vs periode sebelumnya
 * Sesuai kontrak: GET /api/dashboard/trend
 * @param {string} userId
 * @param {number} days
 */
async function getTrendData(userId, days = 7) {
  if (!userId) {
    return {
      period: `${days} hari terakhir`,
      currentHours: 0,
      prevHours: 0,
      trenJamKerja: "0%",
      currentSymptoms: 0,
      prevSymptoms: 0,
      trenKeluhan: "0%",
      kategoriKeluhanTerbanyak: [],
      ergonomicBreakdown: {
        hasData: false,
        totalComplaints: 0,
        categories: [],
      },
      hasData: false,
    };
  }

  const periodDays = parseInt(days) || 7;
  const now = new Date();

  // Periode saat ini: [now - periodDays, now]
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - periodDays);

  // Periode sebelumnya: [now - 2*periodDays, now - periodDays]
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - periodDays);

  const whereCurrent = {
    userId: String(userId),
    createdAt: { gte: currentStart, lte: now },
  };
  const wherePrevious = {
    userId: String(userId),
    createdAt: { gte: prevStart, lt: currentStart },
  };

  const [currentLogs, prevLogs] = await Promise.all([
    prisma.workLog.findMany({ where: whereCurrent }),
    prisma.workLog.findMany({ where: wherePrevious }),
  ]);

  // Hitung total jam kerja & total keluhan saat ini
  const currentHours = currentLogs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);
  const currentSymptoms = currentLogs.reduce((count, item) => {
    return count + extractRealSymptoms(item.symptoms).length;
  }, 0);

  // Hitung total jam kerja & total keluhan periode sebelumnya
  const prevHours = prevLogs.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0);
  const prevSymptoms = prevLogs.reduce((count, item) => {
    return count + extractRealSymptoms(item.symptoms).length;
  }, 0);

  // Fungsi helper kalkulasi persentase perubahan
  const calcPercent = (curr, prev) => {
    if (prev === 0) {
      if (curr === 0) return "0%";
      return "+100%";
    }
    const diff = ((curr - prev) / prev) * 100;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  };

  // Frekuensi keluhan terbanyak dari logs saat ini (Hanya keluhan nyata)
  const symptomFreq = {};
  currentLogs.forEach((item) => {
    const realList = extractRealSymptoms(item.symptoms);
    realList.forEach((s) => {
      symptomFreq[s] = (symptomFreq[s] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const topSymptoms = sortedSymptoms.slice(0, 3).map((s) => s.name);

  // Kategori keluhan tubuh untuk Wawasan Ergonomi Tubuh
  // 1. Pinggang / Lumbal
  // 2. Bahu, Leher & Tengkuk
  // 3. Lutut & Kaki
  let pinggangCount = 0;
  let bahuLeherCount = 0;
  let lututKakiCount = 0;
  let otherCount = 0;

  currentLogs.forEach((item) => {
    const realList = extractRealSymptoms(item.symptoms);

    realList.forEach((s) => {
      const lower = s.toLowerCase();
      if (
        lower.includes("pinggang") ||
        lower.includes("lumbal") ||
        lower.includes("punggung") ||
        lower.includes("boyok") ||
        lower.includes("encok")
      ) {
        pinggangCount++;
      } else if (
        lower.includes("bahu") ||
        lower.includes("leher") ||
        lower.includes("tengkuk") ||
        lower.includes("pundak") ||
        lower.includes("tengeng")
      ) {
        bahuLeherCount++;
      } else if (
        lower.includes("lutut") ||
        lower.includes("kaki") ||
        lower.includes("betis") ||
        lower.includes("dengkul") ||
        lower.includes("paha") ||
        lower.includes("kesemutan")
      ) {
        lututKakiCount++;
      } else {
        otherCount++;
      }
    });
  });

  const totalCategorized = pinggangCount + bahuLeherCount + lututKakiCount + otherCount;
  const ergonomicBreakdown = {
    hasData: totalCategorized > 0,
    totalComplaints: totalCategorized,
    categories: [
      {
        id: "lumbal",
        label: "Pinggang Bawah (Lumbal)",
        count: pinggangCount,
        percentage: totalCategorized > 0 ? Math.round((pinggangCount / totalCategorized) * 100) : 0,
        color: "bg-amber-500",
      },
      {
        id: "bahu_leher",
        label: "Bahu, Leher & Tengkuk",
        count: bahuLeherCount,
        percentage: totalCategorized > 0 ? Math.round((bahuLeherCount / totalCategorized) * 100) : 0,
        color: "bg-cyan-700",
      },
      {
        id: "lutut_kaki",
        label: "Lutut & Kaki",
        count: lututKakiCount,
        percentage: totalCategorized > 0 ? Math.round((lututKakiCount / totalCategorized) * 100) : 0,
        color: "bg-slate-400",
      },
    ],
  };

  return {
    period: `${periodDays} hari terakhir`,
    currentHours,
    prevHours,
    trenJamKerja: calcPercent(currentHours, prevHours),
    currentSymptoms,
    prevSymptoms,
    trenKeluhan: calcPercent(currentSymptoms, prevSymptoms),
    kategoriKeluhanTerbanyak: topSymptoms,
    ergonomicBreakdown,
    hasData: currentLogs.length > 0,
  };
}

module.exports = {
  getDashboardSummary,
  getCorrelationData,
  getTrendData,
};

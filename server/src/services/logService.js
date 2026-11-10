// ============================================================
// server/src/services/logService.js
// Logika bisnis pencatatan kesehatan & jam kerja (WorkLog).
// Dikelola secara mutlak oleh P1.
// ============================================================
const prisma = require("../lib/prisma");

/**
 * Mengambil seluruh histori log milik pengguna tertentu
 * @param {string} userId - ID Pengguna (dari decoded token JWT)
 * @returns {Promise<Array>} List WorkLog terurut dari yang terbaru
 */
async function getUserLogs(userId) {
  return await prisma.workLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Membuat entri log baru untuk pengguna
 * @param {string} userId - ID Pengguna
 * @param {Object} data - { workHours, income, symptoms }
 * @returns {Promise<Object>} Entri WorkLog yang baru dibuat
 */
async function createLog(userId, { workHours, income, symptoms }) {
  return await prisma.workLog.create({
    data: {
      userId,
      workHours,
      income: income !== undefined ? income : null,
      symptoms: symptoms || [],
    },
  });
}

/**
 * Fitur Quick Log: Mengambil log terakhir pengguna dan menduplikasikannya
 * Jika pengguna belum punya histori log, membuat log default (8 jam, bebas keluhan).
 * @param {string} userId - ID Pengguna
 * @returns {Promise<Object>} Entri WorkLog baru hasil duplikasi
 */
async function createQuickLog(userId) {
  // 1. Cari log terakhir milik user
  const latestLog = await prisma.workLog.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 2. Tentukan data duplikasi
  const workHours = latestLog ? latestLog.workHours : 8;
  const income = latestLog ? latestLog.income : 250000;
  const symptoms = latestLog ? latestLog.symptoms : ["Bebas Keluhan (Sehat)"];

  // 3. Simpan sebagai entri log baru untuk hari ini
  return await prisma.workLog.create({
    data: {
      userId,
      workHours,
      income,
      symptoms,
    },
  });
}

module.exports = {
  getUserLogs,
  createLog,
  createQuickLog,
};


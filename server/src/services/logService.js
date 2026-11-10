// ============================================================
// server/src/services/logService.js
// Logika bisnis CRUD pencatatan kesehatan & jam kerja (WorkLog).
// Dikelola secara mutlak oleh P1.
// ============================================================
const prisma = require("../lib/prisma");

/**
 * Mengambil seluruh histori log milik pengguna tertentu
 * Mendukung filter limit dan rentang tanggal untuk kebutuhan Dashboard P3 dan Ergo-Coach P2
 * @param {string} userId - ID Pengguna (dari decoded token JWT)
 * @param {Object} [filter] - { limit, startDate, endDate }
 * @returns {Promise<Array>} List WorkLog terurut dari yang terbaru
 */
async function getUserLogs(userId, { limit, startDate, endDate } = {}) {
  const where = { userId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const queryOptions = {
    where,
    orderBy: { createdAt: "desc" },
  };

  if (limit && Number.isInteger(limit) && limit > 0) {
    queryOptions.take = limit;
  }

  return await prisma.workLog.findMany(queryOptions);
}

/**
 * Mengambil satu catatan log berdasarkan ID
 * @param {string} userId - ID Pengguna pemilik
 * @param {string} logId - ID Log
 * @returns {Promise<Object|null>}
 */
async function getLogById(userId, logId) {
  return await prisma.workLog.findFirst({
    where: {
      id: logId,
      userId,
    },
  });
}

/**
 * Mengambil catatan log paling baru untuk pengguna
 * @param {string} userId - ID Pengguna
 * @returns {Promise<Object|null>}
 */
async function getLatestLog(userId) {
  return await prisma.workLog.findFirst({
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
 * Memperbarui catatan log yang sudah ada
 * @param {string} userId - ID Pengguna pemilik
 * @param {string} logId - ID Log
 * @param {Object} data - { workHours, income, symptoms }
 * @returns {Promise<Object>}
 */
async function updateLog(userId, logId, { workHours, income, symptoms }) {
  // Pastikan log tersebut milik user yang bersangkutan
  const existingLog = await prisma.workLog.findFirst({
    where: { id: logId, userId },
  });

  if (!existingLog) {
    const error = new Error("Catatan log tidak ditemukan atau Anda tidak memiliki akses.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.workLog.update({
    where: { id: logId },
    data: {
      ...(workHours !== undefined && { workHours }),
      ...(income !== undefined && { income }),
      ...(symptoms !== undefined && { symptoms }),
    },
  });
}

/**
 * Menghapus catatan log milik pengguna
 * @param {string} userId - ID Pengguna pemilik
 * @param {string} logId - ID Log
 * @returns {Promise<Object>}
 */
async function deleteLog(userId, logId) {
  const existingLog = await prisma.workLog.findFirst({
    where: { id: logId, userId },
  });

  if (!existingLog) {
    const error = new Error("Catatan log tidak ditemukan atau Anda tidak memiliki akses.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.workLog.delete({
    where: { id: logId },
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
  const symptoms = latestLog && latestLog.symptoms?.length > 0 ? latestLog.symptoms : ["Bebas Keluhan & Bugar"];

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
  getLogById,
  getLatestLog,
  createLog,
  updateLog,
  deleteLog,
  createQuickLog,
};

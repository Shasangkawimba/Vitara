/**
 * Layanan Pengingat Kesehatan (Reminder Service)
 * Mengelola data pengingat per-user di database Prisma.
 * Milik P4, dipakai oleh routes/reminders.js.
 */

const prisma = require("../lib/prisma");

/**
 * Mengambil seluruh daftar pengingat milik user.
 * @param {string} userId - ID Pengguna (wajib dari authenticateToken)
 * @returns {Promise<Array>} Daftar pengingat
 */
async function getAllReminders(userId) {
  return prisma.reminder.findMany({
    where: { userId },
    orderBy: { time: "asc" },
  });
}

/**
 * Membuat data pengingat baru untuk user.
 * @param {Object} data - Data pengingat
 * @param {string} data.title - Judul pengingat
 * @param {string} data.time - Waktu pengingat format HH:mm
 * @param {string} [data.type] - Kategori pengingat (WATER, REST, STRETCH, MEDICINE, CUSTOM)
 * @param {Array<string>} [data.days] - Hari aktif
 * @param {string} [data.notes] - Catatan tambahan
 * @param {string} userId - ID Pengguna
 * @returns {Promise<Object>} Pengingat yang baru dibuat
 */
async function createReminder(data, userId) {
  const { title, time, type = "CUSTOM", days = [], notes = "" } = data;
  return prisma.reminder.create({
    data: {
      title,
      time,
      type,
      days,
      notes,
      isActive: true,
      userId,
    },
  });
}

/**
 * Mengubah status aktif/non-aktif pengingat milik user.
 * @param {string} id - ID pengingat
 * @param {string} userId - ID user pemilik
 * @returns {Promise<Object|null>} Pengingat yang diperbarui atau null bila tidak ditemukan
 */
async function toggleReminderStatus(id, userId) {
  const existing = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.reminder.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}

/**
 * Menghapus pengingat milik user berdasarkan ID.
 * @param {string} id - ID pengingat
 * @param {string} userId - ID user pemilik
 * @returns {Promise<boolean>} True jika berhasil dihapus
 */
async function deleteReminder(id, userId) {
  const result = await prisma.reminder.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

module.exports = {
  getAllReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
};
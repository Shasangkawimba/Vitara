/**
 * Layanan Pengingat Kesehatan (Reminder Service)
 * Mengelola data pengingat (jadwal istirahat, minum air, peregangan, minum obat).
 * Didesain modular: otomatis menggunakan Prisma jika P1 telah membuat model Reminder,
 * atau menggunakan fallback penyimpanan memori lokal jika migrasi Prisma belum tersedia.
 */

// Penyimpanan sementara (fallback in-memory) sebelum database Prisma di-setup oleh P1
let inMemoryReminders = [
  {
    id: '1',
    title: 'Waktu Istirahat & Minum Air',
    time: '12:00',
    type: 'WATER',
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    notes: 'Istirahat sejenak 10 menit dan minum segelas air putih.',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Peregangan Otot Punggung & Bahu',
    time: '15:30',
    type: 'STRETCH',
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    notes: 'Lakukan peregangan leher, bahu, dan punggung setelah berkendara.',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Cek apakah Prisma Client tersedia dan memiliki model Reminder
let prisma = null;
try {
  // eslint-disable-next-line global-require
  const { PrismaClient } = require('@prisma/client');
  const client = new PrismaClient();
  if (client.reminder) {
    prisma = client;
  }
} catch {
  // Prisma belum di-generate atau belum di-setup oleh P1
  prisma = null;
}

/**
 * Mengambil seluruh daftar pengingat milik pengguna.
 * @param {string} [userId] - ID Pengguna (jika ada sistem auth)
 * @returns {Promise<Array>} Daftar pengingat
 */
async function getAllReminders(userId) {
  if (prisma && prisma.reminder) {
    return prisma.reminder.findMany({
      where: userId ? { userId } : {},
      orderBy: { time: 'asc' },
    });
  }
  return inMemoryReminders;
}

/**
 * Membuat data pengingat baru.
 * @param {Object} data - Data pengingat
 * @param {string} data.title - Judul pengingat
 * @param {string} data.time - Waktu pengingat format HH:mm
 * @param {string} [data.type] - Kategori pengingat (WATER, REST, STRETCH, MEDICINE, CUSTOM)
 * @param {Array<string>} [data.days] - Hari aktif
 * @param {string} [data.notes] - Catatan tambahan
 * @param {string} [userId] - ID Pengguna
 * @returns {Promise<Object>} Pengingat yang baru dibuat
 */
async function createReminder(data, userId) {
  const { title, time, type = 'CUSTOM', days = [], notes = '' } = data;

  if (prisma && prisma.reminder) {
    return prisma.reminder.create({
      data: {
        title,
        time,
        type,
        days: JSON.stringify(days),
        notes,
        isActive: true,
        ...(userId ? { userId } : {}),
      },
    });
  }

  const newReminder = {
    id: Date.now().toString(),
    title,
    time,
    type,
    days: Array.isArray(days) && days.length > 0 ? days : ['Setiap Hari'],
    notes,
    isActive: true,
    userId: userId || null,
    createdAt: new Date().toISOString(),
  };

  inMemoryReminders.push(newReminder);
  return newReminder;
}

/**
 * Mengubah status aktif/non-aktif pengingat.
 * @param {string} id - ID pengingat
 * @returns {Promise<Object|null>} Pengingat yang diperbarui
 */
async function toggleReminderStatus(id) {
  if (prisma && prisma.reminder) {
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return null;
    return prisma.reminder.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  const reminder = inMemoryReminders.find((r) => r.id === id);
  if (!reminder) return null;

  reminder.isActive = !reminder.isActive;
  return reminder;
}

/**
 * Menghapus pengingat berdasarkan ID.
 * @param {string} id - ID pengingat
 * @returns {Promise<boolean>} True jika berhasil dihapus
 */
async function deleteReminder(id) {
  if (prisma && prisma.reminder) {
    await prisma.reminder.delete({ where: { id } });
    return true;
  }

  const index = inMemoryReminders.findIndex((r) => r.id === id);
  if (index === -1) return false;

  inMemoryReminders.splice(index, 1);
  return true;
}

module.exports = {
  getAllReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
};

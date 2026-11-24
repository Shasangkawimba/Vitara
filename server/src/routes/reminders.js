// ============================================================
// server/src/routes/reminders.js
// Router API Pengingat Kesehatan VITARA (Milik P4)
// Sesuai dengan spesifikasi di API_CONTRACT.md dan aturan validasi Zod
// ============================================================
const express = require('express');
const router = express.Router();
const reminderService = require('../services/reminderService');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Validasi input menggunakan Zod
let z;
try {
  z = require('zod');
} catch (e) {
  z = null;
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createReminderSchema = z
  ? z.object({
      title: z
        .string({ required_error: 'Judul pengingat wajib diisi.' })
        .min(1, 'Judul pengingat tidak boleh kosong.')
        .max(100, 'Judul pengingat maksimal 100 karakter.'),
      time: z
        .string({ required_error: 'Waktu pengingat wajib diisi.' })
        .regex(timeRegex, 'Format waktu harus HH:mm (contoh: 08:30 atau 14:00).'),
      type: z
        .enum(['WATER', 'REST', 'STRETCH', 'MEDICINE', 'CUSTOM'], {
          errorMap: () => ({ message: 'Tipe pengingat tidak valid.' }),
        })
        .default('CUSTOM')
        .optional(),
      days: z.array(z.string()).optional().default(['Setiap Hari']),
      notes: z.string().max(255, 'Catatan maksimal 255 karakter.').optional().default(''),
    })
  : null;

/**
 * Helper validasi body pembuatan pengingat
 */
function validateCreateReminder(body) {
  if (createReminderSchema) {
    const result = createReminderSchema.safeParse(body);
    if (!result.success) {
      return {
        error: result.error.issues[0]?.message || 'Data pengingat tidak valid.',
      };
    }
    return { data: result.data };
  }

  // Fallback validasi manual tanpa Zod
  const { title, time, type = 'CUSTOM', days = ['Setiap Hari'], notes = '' } = body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { error: 'Judul pengingat wajib diisi.' };
  }
  if (!time || !timeRegex.test(time)) {
    return { error: 'Format waktu harus HH:mm (contoh: 08:30 atau 14:00).' };
  }
  return {
    data: {
      title: title.trim(),
      time,
      type,
      days: Array.isArray(days) ? days : ['Setiap Hari'],
      notes: typeof notes === 'string' ? notes.trim() : '',
    },
  };
}

/**
 * GET /api/reminders
 * Mengambil daftar seluruh pengingat milik user (wajib login)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reminders = await reminderService.getAllReminders(userId);
    return res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar pengingat:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat memuat daftar pengingat.',
    });
  }
});

/**
 * POST /api/reminders
 * Membuat pengingat baru (wajib login)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = validateCreateReminder(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    const userId = req.user.id;
    const newReminder = await reminderService.createReminder(data, userId);

    return res.status(201).json({
      success: true,
      data: newReminder,
    });
  } catch (error) {
    console.error('Error saat membuat pengingat:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menyimpan pengingat baru.',
    });
  }
});

/**
 * PATCH /api/reminders/:id/toggle
 * Mengaktifkan atau menonaktifkan pengingat milik user (wajib login)
 */
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updated = await reminderService.toggleReminderStatus(id, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Pengingat tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error saat memperbarui status pengingat:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengubah status pengingat.',
    });
  }
});

/**
 * DELETE /api/reminders/:id
 * Menghapus pengingat milik user berdasarkan ID (wajib login)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isDeleted = await reminderService.deleteReminder(id, userId);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Pengingat tidak ditemukan atau sudah dihapus.',
      });
    }

    return res.json({
      success: true,
      data: { id, message: 'Pengingat berhasil dihapus.' },
    });
  } catch (error) {
    console.error('Error saat menghapus pengingat:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menghapus pengingat.',
    });
  }
});

module.exports = router;

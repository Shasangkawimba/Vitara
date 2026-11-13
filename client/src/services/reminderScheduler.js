// ============================================================
// client/src/services/reminderScheduler.js
// Layanan Web Notification & Scheduler Otomatis VITARA (Milik P4)
// Mendukung Web Notification API, Web Audio API Chime, dan Geolocation/Vibration
// ============================================================

const DAYS_NAME = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Memainkan nada bel lembut (chime alert) menggunakan Web Audio API
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Nada pertama (Frekuensi C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nada kedua (Frekuensi G6 lebih tinggi & ceria)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('AudioContext tidak dapat dijalankan:', err.message);
  }
}

// Meminta izin Web Notification dari pengguna
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Gagal meminta izin notifikasi:', err);
    return 'denied';
  }
}

// Mengirimkan notifikasi Web Notification
export function sendWebNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Bunyikan nada bel
    playNotificationSound();

    // Efek getar jika didukung (terutama di smartphone/Android)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vitara-health-reminder',
      renotify: true,
      requireInteraction: false,
      body: 'Waktunya istirahat dan jaga kebugaran tubuh saat bekerja.',
      ...options,
    };

    const notification = new Notification(title, defaultOptions);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Gagal memicu Web Notification:', err);
    return false;
  }
}

// Riwayat pengecekan menit terakhir agar tidak terjadi notifikasi ganda pada menit yang sama
let lastCheckedMinute = '';

/**
 * Mengecek apakah ada pengingat aktif yang cocok dengan waktu & hari saat ini.
 * Dipanggil secara berkala (misal setiap 15-30 detik oleh timer).
 * 
 * @param {Array} reminders - Daftar pengingat dari state / API
 * @param {Function} [onTriggered] - Callback saat ada pengingat yang berbunyi
 */
export function checkDueReminders(reminders, onTriggered) {
  if (!Array.isArray(reminders) || reminders.length === 0) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;
  const currentDayName = DAYS_NAME[now.getDay()];

  // Kunci menit ini (contoh: "2026-11-13 14:30")
  const minuteKey = `${now.toDateString()} ${currentTimeString}`;
  if (lastCheckedMinute === minuteKey) {
    return; // Sudah dicek pada menit yang sama
  }

  lastCheckedMinute = minuteKey;

  reminders.forEach((reminder) => {
    if (!reminder.isActive) return;

    // Cek kecocokan jam
    if (reminder.time === currentTimeString) {
      // Cek kecocokan hari
      const days = Array.isArray(reminder.days)
        ? reminder.days
        : typeof reminder.days === 'string'
        ? JSON.parse(reminder.days || '[]')
        : ['Setiap Hari'];

      const isToday =
        days.includes('Setiap Hari') ||
        days.includes(currentDayName) ||
        (days.includes('Senin-Jumat') && !['Sabtu', 'Minggu'].includes(currentDayName));

      if (isToday) {
        // Tembakkan notifikasi browser!
        sendWebNotification(`⏰ VITARA: ${reminder.title}`, {
          body: reminder.notes || 'Waktunya rehat sejenak dan jaga kesehatan tubuh!',
          tag: `reminder-${reminder.id}-${minuteKey}`,
        });

        if (onTriggered) {
          onTriggered(reminder);
        }
      }
    }
  });
}

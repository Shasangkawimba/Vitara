// ============================================================
// client/src/pages/Reminder/index.jsx
// Halaman Pengingat Kesehatan VITARA (Milik P4)
// Fitur: Time picker, pemilihan kategori, pengulangan hari,
// manajemen jadwal pengingat, dan integrasi notifikasi browser.
// ============================================================
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Daftar kategori pengingat kesehatan kerja
const CATEGORIES = [
  {
    id: 'WATER',
    label: 'Minum Air',
    icon: '💧',
    defaultTitle: 'Waktunya Minum Air Putih',
    defaultNotes: 'Minum 1-2 gelas air agar tidak dehidrasi saat bekerja.',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-600',
  },
  {
    id: 'REST',
    label: 'Istirahat',
    icon: '☕',
    defaultTitle: 'Waktu Istirahat Sejenak',
    defaultNotes: 'Berhenti sejenak selama 10-15 menit untuk mengistirahatkan mata dan pikiran.',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-600 text-white border-amber-600',
  },
  {
    id: 'STRETCH',
    label: 'Peregangan',
    icon: '🧘',
    defaultTitle: 'Peregangan Otot & Punggung',
    defaultNotes: 'Lakukan peregangan leher, bahu, dan pinggang untuk mencegah pegal-pegal.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeColor: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    id: 'MEDICINE',
    label: 'Obat/Vitamin',
    icon: '💊',
    defaultTitle: 'Waktunya Minum Obat / Vitamin',
    defaultNotes: 'Jangan lupa minum vitamin atau obat sesuai jadwal Anda.',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-600 text-white border-purple-600',
  },
  {
    id: 'CUSTOM',
    label: 'Kustom',
    icon: '⏰',
    defaultTitle: 'Pengingat Kesehatan',
    defaultNotes: '',
    color: 'bg-[#cce3ed] text-slate-800 border-[#b8d8e5]',
    activeColor: 'bg-sky-500 text-white border-sky-600 font-bold shadow-md ring-2 ring-sky-400/50 scale-[1.02]',
  },
];

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function ReminderPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Form
  const [time, setTime] = useState('12:00');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState(CATEGORIES[0].defaultTitle);
  const [notes, setNotes] = useState(CATEGORIES[0].defaultNotes);
  const [selectedDays, setSelectedDays] = useState([...DAYS_LIST]);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Status Web Notification
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  // Memuat data pengingat dari API saat komponen dimuat
  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await api.get('/api/reminders');
      if (response.data && response.data.success) {
        setReminders(response.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data pengingat:', err);
      setErrorMessage('Gagal memuat jadwal pengingat. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handler saat kategori diubah
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setTitle(category.defaultTitle);
    setNotes(category.defaultNotes);
  };

  // Handler toggle hari
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Minimal pilih 1 hari
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Pilih preset hari
  const selectAllDays = () => setSelectedDays([...DAYS_LIST]);
  const selectWorkDays = () => setSelectedDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const selectWeekend = () => setSelectedDays(['Sabtu', 'Minggu']);

  // Preset jam cepat
  const setQuickTime = (hhMm) => {
    setTime(hhMm);
  };

  // Simpan pengingat baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul pengingat wajib diisi.');
      return;
    }
    if (!time) {
      setErrorMessage('Waktu pengingat wajib ditentukan.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = {
        title: title.trim(),
        time,
        type: selectedCategory.id,
        days: selectedDays.length === 7 ? ['Setiap Hari'] : selectedDays,
        notes: notes.trim(),
      };

      const response = await api.post('/api/reminders', payload);
      if (response.data && response.data.success) {
        setSuccessMessage('Pengingat baru berhasil disimpan!');
        setIsFormOpen(false);
        fetchReminders();
        setTimeout(() => setSuccessMessage(''), 3500);
      }
    } catch (err) {
      console.error('Gagal menyimpan pengingat:', err);
      const serverErr = err.response?.data?.error || 'Gagal menyimpan pengingat.';
      setErrorMessage(serverErr);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status aktif/nonaktif pengingat
  const handleToggleActive = async (id) => {
    try {
      const response = await api.patch(`/api/reminders/${id}/toggle`);
      if (response.data && response.data.success) {
        setReminders((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
        );
      }
    } catch (err) {
      console.error('Gagal mengubah status pengingat:', err);
      setErrorMessage('Gagal memperbarui status pengingat.');
    }
  };

  // Hapus pengingat
  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengingat ini?')) return;

    try {
      const response = await api.delete(`/api/reminders/${id}`);
      if (response.data && response.data.success) {
        setReminders((prev) => prev.filter((item) => item.id !== id));
        setSuccessMessage('Pengingat berhasil dihapus.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Gagal menghapus pengingat:', err);
      setErrorMessage('Gagal menghapus pengingat.');
    }
  };

  // Meminta izin Web Notification
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notification API.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        new Notification('VITARA — Notifikasi Aktif', {
          body: 'Notifikasi pengingat kesehatan kerja Anda siap bekerja!',
          icon: '/icon-192.png',
        });
      }
    } catch (err) {
      console.error('Error saat meminta izin notifikasi:', err);
    }
  };

  // Helper mendapatkan warna badge kategori
  const getCategoryBadge = (type) => {
    const cat = CATEGORIES.find((c) => c.id === type) || CATEGORIES[4];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
        <span>{cat.icon}</span>
        <span>{cat.label}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Halaman */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <h1 className="text-2xl font-bold text-slate-800">Pengingat Kesehatan</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Atur alarm istirahat, minum air, dan peregangan saat berkendara atau bekerja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isFormOpen ? 'rotate-45' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormOpen ? 'Tutup Form' : 'Tambah Pengingat'}
          </button>
        </div>

        {/* Notifikasi Izin Browser */}
        {notificationPermission !== 'granted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Aktifkan Notifikasi Browser</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Izinkan notifikasi agar VITARA dapat mengingatkan Anda tepat waktu meskipun sedang membuka aplikasi lain.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition whitespace-nowrap"
            >
              Aktifkan Izin
            </button>
          </div>
        )}

        {/* Pesan Sukses / Error Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 font-bold">
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage('')} className="text-red-600 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Form Pembuatan Pengingat Baru (Expandable) */}
        {isFormOpen && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fadeIn transition-all">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>➕</span> Buat Pengingat Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pilihan Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Kategori Pengingat
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSelected ? cat.activeColor : `${cat.color} hover:opacity-90`
                        }`}
                      >
                        <span className="text-xl mb-1">{cat.icon}</span>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Picker (Pilihan Waktu) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Waktu Pengingat (Jam & Menit)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full text-2xl font-bold tracking-widest text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-center"
                    />
                  </div>
                  {/* Preset Jam Cepat */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['09:00', '12:00', '15:00', '18:00', '21:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuickTime(preset)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition ${
                          time === preset
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Judul Pengingat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Judul Pengingat
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Istirahat & Minum Air"
                  required
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 dark:text-white dark:bg-slate-800"
                />
              </div>

              {/* Catatan / Pesan Pengingat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Pesan / Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Tulis pesan pengingat untuk diri sendiri..."
                  maxLength={255}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 dark:text-white dark:bg-slate-800"
                />
              </div>

              {/* Pilihan Hari Pengulangan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Ulangi Pada Hari
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllDays}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      Setiap Hari
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={selectWorkDays}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      Senin-Jumat
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_LIST.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 text-xs font-medium rounded-lg border transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Aksi Form */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Pengingat</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Jadwal Pengingat */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Daftar Pengingat Aktif ({reminders.length})
            </h2>
            <button
              type="button"
              onClick={fetchReminders}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Memuat daftar pengingat...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <span className="text-4xl">📭</span>
              <h3 className="text-base font-semibold text-slate-800 mt-2">Belum Ada Pengingat</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Anda belum memiliki jadwal pengingat aktif. Klik tombol "Tambah Pengingat" di atas untuk membuat pengingat pertama Anda.
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition"
              >
                + Tambah Pengingat Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const daysLabel = Array.isArray(reminder.days)
                  ? reminder.days.join(', ')
                  : typeof reminder.days === 'string'
                  ? reminder.days
                  : 'Setiap Hari';

                return (
                  <div
                    key={reminder.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      reminder.isActive
                        ? 'border-slate-200 hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Jam Besar */}
                      <div className="bg-slate-100 rounded-xl px-3 py-2 text-center min-w-[70px]">
                        <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                          {reminder.time}
                        </span>
                      </div>

                      {/* Detail Judul, Kategori, & Hari */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-800">{reminder.title}</h3>
                          {getCategoryBadge(reminder.type)}
                        </div>

                        {reminder.notes && (
                          <p className="text-xs text-slate-600 line-clamp-2">{reminder.notes}</p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{daysLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Kontrol (Toggle On/Off & Hapus) */}
                    <div className="flex items-center justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Switch Toggle Aktif */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(reminder.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          reminder.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        aria-label={reminder.isActive ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat'}
                        title={reminder.isActive ? 'Pengingat Aktif' : 'Pengingat Nonaktif'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            reminder.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleDelete(reminder.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus Pengingat"
                        aria-label="Hapus Pengingat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

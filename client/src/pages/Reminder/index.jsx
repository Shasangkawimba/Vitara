// ============================================================
// client/src/pages/Reminder/index.jsx
// Pengingat Kesehatan VITARA (Milik P4).
// Fitur: time picker, kategori, pengulangan hari, Web Notification
// API, Web Audio Chime, dan scheduler real-time.
// Tampilan mengikuti bahasa desain Stitch: kartu radius besar,
// satu aksen pine, chip pill, ikon Material Symbols (tanpa emoji).
// ============================================================
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  sendWebNotification,
  requestNotificationPermission as requestPermissionHelper,
  checkDueReminders,
} from "../../services/reminderScheduler";
import { aktifkanPush } from "../../services/pushService";

// Daftar kategori pengingat kesehatan kerja (ikon Material Symbols)
const CATEGORIES = [
  {
    id: "WATER",
    label: "Minum Air",
    icon: "water_drop",
    defaultTitle: "Waktunya Minum Air Putih",
    defaultNotes: "Minum 1-2 gelas air agar tidak dehidrasi saat bekerja.",
  },
  {
    id: "REST",
    label: "Istirahat",
    icon: "local_cafe",
    defaultTitle: "Waktu Istirahat Sejenak",
    defaultNotes:
      "Berhenti sejenak selama 10-15 menit untuk mengistirahatkan mata dan pikiran.",
  },
  {
    id: "STRETCH",
    label: "Peregangan",
    icon: "accessibility_new",
    defaultTitle: "Peregangan Otot & Punggung",
    defaultNotes:
      "Lakukan peregangan leher, bahu, dan pinggang untuk mencegah pegal-pegal.",
  },
  {
    id: "MEDICINE",
    label: "Obat/Vitamin",
    icon: "medication",
    defaultTitle: "Waktunya Minum Obat / Vitamin",
    defaultNotes: "Jangan lupa minum vitamin atau obat sesuai jadwal Anda.",
  },
  {
    id: "CUSTOM",
    label: "Kustom",
    icon: "alarm",
    defaultTitle: "Pengingat Kesehatan",
    defaultNotes: "",
  },
];

const DAYS_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Rekomendasi cepat sekali klik
const PRESETS = [
  {
    kategori: 0,
    jam: "10:00",
    ikon: "water_drop",
    judul: "Hidrasi pagi",
    ket: "Minum 2 gelas air putih",
    judulPesan: "Hidrasi Pagi (Minum 2 Gelas)",
    catatan: "Cegah dehidrasi di jalanan terik.",
  },
  {
    kategori: 1,
    jam: "12:30",
    ikon: "local_cafe",
    judul: "Rehat siang",
    ket: "Rehat makan & istirahatkan mata",
    judulPesan: "Rehat Siang & Peregangan",
    catatan: "Parkir di tempat teduh dan rehat 15 menit.",
  },
  {
    kategori: 2,
    jam: "15:30",
    ikon: "accessibility_new",
    judul: "Peregangan sore",
    ket: "Relaksasi leher & pinggang",
    judulPesan: "Peregangan Leher & Pinggang",
    catatan: "Lakukan relaksasi otot setelah berkendara lama.",
  },
];

export default function ReminderPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastTriggeredReminder, setLastTriggeredReminder] = useState(null);

  // Waktu sistem saat ini (jam digital)
  const [currentTime, setCurrentTime] = useState(new Date());

  // State Form
  const [time, setTime] = useState("12:00");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState(CATEGORIES[0].defaultTitle);
  const [notes, setNotes] = useState(CATEGORIES[0].defaultNotes);
  const [selectedDays, setSelectedDays] = useState([...DAYS_LIST]);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Status Web Notification
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  // 1. Memuat data pengingat dari API saat komponen dimuat
  useEffect(() => {
    fetchReminders();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      aktifkanPush();
    }
  }, []);

  // 2. Scheduler Waktu Nyata (Pengecekan otomatis setiap 15 detik)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Periksa apakah ada alarm yang jamnya tiba
      if (reminders.length > 0) {
        checkDueReminders(reminders, (triggered) => {
          setLastTriggeredReminder(triggered);
          setSuccessMessage(`Alarm berbunyi: ${triggered.title}`);
          setTimeout(() => setSuccessMessage(""), 8000);
        });
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [reminders]);

  // 3. Umpan balik saat alarm berbunyi dari scheduler global (Layout),
  //    sehingga pesan sukses tetap muncul walau halaman ini tidak memicunya.
  useEffect(() => {
    const saatAlarm = (e) => {
      const reminder = e.detail;
      if (!reminder) return;
      setLastTriggeredReminder(reminder);
      setSuccessMessage(`Alarm berbunyi: ${reminder.title}`);
      setTimeout(() => setSuccessMessage(""), 8000);
    };
    window.addEventListener("vitara:reminder", saatAlarm);
    return () => window.removeEventListener("vitara:reminder", saatAlarm);
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await api.get("/api/reminders");
      if (response.data && response.data.success) {
        setReminders(response.data.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data pengingat:", err);
      setErrorMessage("Gagal memuat jadwal pengingat. Silakan periksa koneksi backend.");
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

  // Preset hari
  const selectAllDays = () => setSelectedDays([...DAYS_LIST]);
  const selectWorkDays = () =>
    setSelectedDays(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]);

  // Terapkan Preset Gig Worker Cepat
  const applyPreset = (categoryIndex, presetTime, customTitle, customNotes) => {
    const cat = CATEGORIES[categoryIndex];
    setSelectedCategory(cat);
    setTime(presetTime);
    setTitle(customTitle || cat.defaultTitle);
    setNotes(customNotes || cat.defaultNotes);
    setSelectedDays([...DAYS_LIST]);
    setIsFormOpen(true);
  };

  // Simpan pengingat baru ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Judul pengingat wajib diisi.");
      return;
    }
    if (!time) {
      setErrorMessage("Waktu pengingat wajib ditentukan.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      const payload = {
        title: title.trim(),
        time,
        type: selectedCategory.id,
        days: selectedDays.length === 7 ? ["Setiap Hari"] : selectedDays,
        notes: notes.trim(),
      };

      const response = await api.post("/api/reminders", payload);
      if (response.data && response.data.success) {
        setSuccessMessage("Pengingat baru berhasil disimpan ke jadwal!");
        fetchReminders();
        setTimeout(() => setSuccessMessage(""), 3500);
      }
    } catch (err) {
      console.error("Gagal menyimpan pengingat:", err);
      const serverErr = err.response?.data?.error || "Gagal menyimpan pengingat.";
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
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        );
      }
    } catch (err) {
      console.error("Gagal mengubah status pengingat:", err);
      setErrorMessage("Gagal memperbarui status pengingat.");
    }
  };

  // Hapus pengingat
  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengingat ini?")) return;

    try {
      const response = await api.delete(`/api/reminders/${id}`);
      if (response.data && response.data.success) {
        setReminders((prev) => prev.filter((item) => item.id !== id));
        setSuccessMessage("Pengingat berhasil dihapus.");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Gagal menghapus pengingat:", err);
      setErrorMessage("Gagal menghapus pengingat.");
    }
  };

  // Meminta izin Web Notification
  const handleRequestPermission = async () => {
    const res = await requestPermissionHelper();
    setNotificationPermission(res);

    if (res === "granted") {
      sendWebNotification("VITARA: Notifikasi berhasil diaktifkan", {
        body: "Pengingat istirahat dan hidrasi Anda kini aktif di browser ini.",
      });
      const pushAktif = await aktifkanPush();
      setSuccessMessage(
        pushAktif
          ? "Izin notifikasi diberikan. Pengingat aktif walau tab ditutup."
          : "Izin notifikasi diberikan. Pengingat aktif saat tab terbuka."
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } else if (res === "denied") {
      alert(
        "Izin notifikasi ditolak oleh browser. Anda dapat mengaktifkannya kembali melalui ikon gembok di sebelah kiri address bar browser Anda."
      );
    }
  };

  // Uji Coba Suara & Notifikasi Langsung
  const handleTestNotification = () => {
    if (notificationPermission !== "granted") {
      handleRequestPermission();
      return;
    }

    const success = sendWebNotification("VITARA: Uji coba pengingat kesehatan", {
      body: "Ini adalah contoh bunyi bel dan notifikasi pengingat istirahat kerja Anda.",
    });

    if (success) {
      setSuccessMessage("Notifikasi uji coba berhasil dikirim!");
      setTimeout(() => setSuccessMessage(""), 3500);
    }
  };

  // Ikon & label kategori untuk daftar pengingat
  const getCategoryInfo = (type) => CATEGORIES.find((c) => c.id === type) || CATEGORIES[4];

  const formattedCurrentTime = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const notifikasiAktif = notificationPermission === "granted";

  return (
    <div className="w-full">
      {/* Hero band pine — konsisten dengan halaman lain */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-6 pt-6 text-white lg:px-12 lg:pt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Pengingat harian
            </span>
            <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight lg:text-[32px]">
              Pengingat Kesehatan
            </h1>
            <p className="mt-1 max-w-lg text-sm text-white/70">
              Atur alarm hidrasi, istirahat, dan peregangan agar ritme kerja tetap
              aman sepanjang shift.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestNotification}
              title="Tes bunyi & pop-up notifikasi"
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              Uji notifikasi
            </button>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-surface-card"
            >
              <span
                className={`material-symbols-outlined text-[18px] transition-transform ${
                  isFormOpen ? "rotate-45" : ""
                }`}
              >
                add
              </span>
              {isFormOpen ? "Sembunyikan form" : "Tambah pengingat"}
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 pb-14 lg:px-12">
        {/* Status sistem: jam, izin browser, penjadwal */}
        <div className="grid grid-cols-1 gap-4 rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card sm:grid-cols-3 lg:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[21px]">schedule</span>
            </span>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Waktu sekarang</p>
              <p className="text-sm font-bold tracking-wide text-text-primary">
                {formattedCurrentTime} WIB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-border-subtle sm:pl-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                notifikasiAktif
                  ? "bg-primary/10 text-primary"
                  : notificationPermission === "denied"
                  ? "bg-red-50 text-red-600"
                  : "bg-surface-subtle text-text-muted"
              }`}
            >
              <span className="material-symbols-outlined text-[21px]">
                {notifikasiAktif ? "notifications_active" : "notifications_off"}
              </span>
            </span>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Izin browser</p>
              <p className="text-sm font-bold text-text-primary">
                {notifikasiAktif
                  ? "Aktif (diizinkan)"
                  : notificationPermission === "denied"
                  ? "Diblokir di browser"
                  : "Belum diizinkan"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-border-subtle sm:pl-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[21px]">sync</span>
            </span>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Pemeriksaan latar</p>
              <p className="text-sm font-bold text-text-primary">Tiap 15 detik</p>
            </div>
          </div>
        </div>

        {/* Banner ajakan izin — pola kartu info yang sama dengan halaman lain */}
        {!notifikasiAktif && (
          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-3xl border border-border-subtle bg-surface-card p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[21px]">
                  notifications_active
                </span>
              </span>
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Aktifkan notifikasi browser
                </h2>
                <p className="mt-0.5 max-w-md text-xs leading-relaxed text-text-muted">
                  Agar alarm VITARA tetap berbunyi dan memunculkan pop-up saat Anda
                  membuka tab lain atau sedang berkendara.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-[16px]">touch_app</span>
              Izinkan sekarang
            </button>
          </div>
        )}

        {/* Pesan sukses / kesalahan / alarm terpicu — pola seragam */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-semibold text-primary-dark">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="shrink-0 rounded-full p-1 text-primary/70 transition-colors hover:text-primary"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {lastTriggeredReminder && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-card px-4 py-3 shadow-card">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary">
              <span className="material-symbols-outlined text-[18px]">alarm</span>
            </span>
            <p className="min-w-0 flex-1 text-[13px] text-text-primary">
              <strong className="font-semibold">Alarm berbunyi:</strong>{" "}
              {lastTriggeredReminder.title} pukul {lastTriggeredReminder.time} WIB.
            </p>
            <button
              type="button"
              onClick={() => setLastTriggeredReminder(null)}
              className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <span className="material-symbols-outlined text-[18px]">error</span>
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-semibold text-red-800">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="shrink-0 rounded-full p-1 text-red-500 transition-colors hover:text-red-700"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          {/* KIRI: rekomendasi + form */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                    Rekomendasi cepat
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Sekali ketuk, jadwal langsung terisi
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.jam}
                    type="button"
                    onClick={() =>
                      applyPreset(
                        preset.kategori,
                        preset.jam,
                        preset.judulPesan,
                        preset.catatan
                      )
                    }
                    className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/70 p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-subtle"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-card text-primary">
                      <span className="material-symbols-outlined text-[19px]">
                        {preset.ikon}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-text-primary">
                        {preset.judul}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                        {preset.ket}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-primary">
                      {preset.jam}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Form pengingat */}
            {isFormOpen && (
              <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
                <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                  Jadwal pengingat baru
                </h2>
                <p className="mt-0.5 text-xs text-text-muted font-body">
                  Sesuaikan waktu dan hari pengulangan
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                  {/* Kategori */}
                  <div>
                    <span className="mb-2 block text-[13px] font-medium text-text-muted">
                      Kategori pengingat
                    </span>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory.id === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors ${
                              isSelected
                                ? "bg-primary text-white shadow-xs"
                                : "bg-surface-subtle text-text-muted hover:bg-surface-container"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[20px] ${
                                isSelected ? "text-white" : "text-text-muted"
                              }`}
                            >
                              {cat.icon}
                            </span>
                            <span className="text-[11px] font-medium leading-tight">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waktu */}
                  <div>
                    <span className="mb-2 block text-[13px] font-medium text-text-muted">
                      Waktu pengingat
                    </span>
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-center text-xl font-bold tracking-widest text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none sm:w-36"
                      />
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                        {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setTime(preset)}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                time === preset
                                  ? "bg-primary text-white"
                                  : "bg-surface-subtle text-text-muted hover:bg-surface-container"
                              }`}
                            >
                              {preset}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Judul */}
                  <div>
                    <label
                      htmlFor="judul-pengingat"
                      className="mb-2 block text-[13px] font-medium text-text-muted"
                    >
                      Judul pengingat
                    </label>
                    <input
                      id="judul-pengingat"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Istirahat & minum air"
                      required
                      maxLength={100}
                      className="w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:bg-surface-card focus:outline-none"
                    />
                  </div>

                  {/* Catatan */}
                  <div>
                    <label
                      htmlFor="catatan-pengingat"
                      className="mb-2 block text-[13px] font-medium text-text-muted"
                    >
                      Pesan tambahan{" "}
                      <span className="font-normal text-text-muted">(opsional)</span>
                    </label>
                    <textarea
                      id="catatan-pengingat"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Tulis pesan pengingat yang akan tampil di pop-up…"
                      maxLength={255}
                      className="w-full resize-none rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:bg-surface-card focus:outline-none"
                    />
                  </div>

                  {/* Hari pengulangan */}
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-text-muted">
                        Ulangi pada hari
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={selectAllDays}
                          className="font-semibold text-primary hover:underline"
                        >
                          Setiap hari
                        </button>
                        <span className="text-text-muted">•</span>
                        <button
                          type="button"
                          onClick={selectWorkDays}
                          className="font-semibold text-primary hover:underline"
                        >
                          Senin–Jumat
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
                            aria-pressed={isSelected}
                            className={`rounded-full py-2 text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-surface-subtle text-text-muted hover:bg-surface-container"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aksi */}
                  <div className="flex justify-end border-t border-border-subtle pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Menyimpan…</span>
                        </>
                      ) : (
                        <span>Simpan Pengingat</span>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>

          {/* KANAN: daftar pengingat */}
          <section className="flex flex-col rounded-4xl border border-border-subtle bg-surface-card shadow-card lg:col-span-5">
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                  Pengingat aktif
                </h2>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {reminders.length} jadwal pada akun Anda
                </p>
              </div>
              <button
                type="button"
                onClick={fetchReminders}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-text-muted transition-colors hover:text-primary"
                aria-label="Muat ulang daftar pengingat"
                title="Muat ulang"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-text-muted">Memuat daftar pengingat…</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="m-4 rounded-3xl border border-dashed border-border-subtle bg-surface-subtle/50 p-8 text-center">
                <span className="material-symbols-outlined text-[34px] text-text-muted">
                  alarm_off
                </span>
                <h3 className="mt-2 text-sm font-semibold text-text-primary">
                  Belum ada pengingat
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-text-muted">
                  Gunakan rekomendasi cepat atau isi form untuk membuat pengingat
                  pertama Anda.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 p-4">
                {reminders.map((reminder) => {
                  const daysLabel = Array.isArray(reminder.days)
                    ? reminder.days.join(", ")
                    : typeof reminder.days === "string"
                    ? reminder.days
                    : "Setiap Hari";
                  const kategori = getCategoryInfo(reminder.type);

                  return (
                    <div
                      key={reminder.id}
                      className={`flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/60 p-4 transition-opacity ${
                        reminder.isActive ? "" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex min-w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-card px-3 py-2">
                          <span className="text-lg font-bold tracking-tight text-text-primary">
                            {reminder.time}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                            WIB
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-[13px] font-bold leading-snug text-text-primary">
                            {reminder.title}
                          </h3>

                          {reminder.notes && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-text-muted">
                              {reminder.notes}
                            </p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                {kategori.icon}
                              </span>
                              {kategori.label}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                calendar_today
                              </span>
                              {daysLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Kontrol */}
                      <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
                        <span className="text-[11px] font-medium text-text-muted">
                          {reminder.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(reminder.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              reminder.isActive ? "bg-primary" : "bg-surface-variant"
                            }`}
                            role="switch"
                            aria-checked={reminder.isActive}
                            aria-label={
                              reminder.isActive
                                ? "Nonaktifkan pengingat"
                                : "Aktifkan pengingat"
                            }
                            title={
                              reminder.isActive ? "Pengingat aktif" : "Pengingat nonaktif"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                                reminder.isActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(reminder.id)}
                            className="rounded-full p-2 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Hapus pengingat"
                            aria-label="Hapus pengingat"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2 border-t border-border-subtle px-5 py-3 text-[11px] text-text-muted">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Alarm berjalan selama tab VITARA terbuka.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

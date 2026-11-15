// ============================================================
// client/src/pages/Logger/Logger.jsx
// Work-Health Logger — tata letak dibangun ulang mengikuti layar
// Stitch "Work-Health Logger" (mobile + desktop):
//   • Hero pine, Timeline mingguan, kartu status hari ini
//   • Form durasi/pendapatan/kondisi fisik dengan pill & chip
//   • Riwayat CRUD, Quick Log, dan input suara tetap utuh
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import VoiceInput from "../../components/VoiceInput";

const SYMPTOM_OPTIONS = [
  {
    id: "Sakit Pinggang",
    label: "Sakit Pinggang",
    subLabel: "Punggung / Lumbal",
    icon: "airline_seat_recline_extra",
    keywords: ["pinggang", "punggung", "lumbal", "pegel pinggang", "boyok", "encok", "pinggang pegel"],
  },
  {
    id: "Leher & Bahu",
    label: "Leher & Bahu",
    subLabel: "Kaku / Tegang",
    icon: "accessibility_new",
    keywords: ["leher", "bahu", "pundak", "kaku", "tenggorokan", "tengeng", "leher kaku", "pegel pundak"],
  },
  {
    id: "Lutut & Kaki",
    label: "Lutut & Kaki",
    subLabel: "Pegal / Kesemutan",
    icon: "directions_walk",
    keywords: ["lutut", "kaki", "betis", "kesemutan", "paha", "dengkul", "pegel linu", "kebas", "kram kaki"],
  },
  {
    id: "Pergelangan",
    label: "Pergelangan",
    subLabel: "Kram Gas / Kopling",
    icon: "pan_tool",
    keywords: ["pergelangan", "tangan", "jari", "kram", "gas", "kopling", "jempol", "tangan kebas"],
  },
  {
    id: "Mata Lelah",
    label: "Mata Lelah",
    subLabel: "Silau Terik / Kering",
    icon: "visibility",
    keywords: ["mata", "silau", "pedih", "sepet", "kabur", "kunang", "buram", "mata kering", "sepet"],
  },
  {
    id: "Pusing Kepala",
    label: "Pusing Kepala",
    subLabel: "Dehidrasi / Panas",
    icon: "sentiment_dissatisfied",
    keywords: ["pusing", "kepala", "migrain", "pening", "dehidrasi", "keliyengan", "masuk angin", "mumet"],
  },
];

const HOUR_PRESETS = [
  { hours: 0, label: "Libur" },
  { hours: 4, label: "4 Jam" },
  { hours: 8, label: "8 Jam" },
  { hours: 10, label: "10 Jam" },
  { hours: 12, label: "12+ Jam" },
];

export default function Logger() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [editingLogId, setEditingLogId] = useState(null);
  // Hari terpilih pada strip Timeline (null → default hari ini).
  const [kunciTerpilih, setKunciTerpilih] = useState(null);
  const [workHours, setWorkHours] = useState(8);
  const [customHours, setCustomHours] = useState("");
  const [halamanRiwayat, setHalamanRiwayat] = useState(1);
  const [income, setIncome] = useState("250.000");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isHealthy, setIsHealthy] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: "", message: "" });
  const [recentLogs, setRecentLogs] = useState([]);
  const [latestLog, setLatestLog] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState("");

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await api.get("/api/logs");
      if (res.data?.success) {
        const logs = res.data.data || [];
        setRecentLogs(logs);
        if (logs.length > 0) setLatestLog(logs[0]);
      }
    } catch {
      // Abaikan jika server belum terhubung.
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const incomePerHour = useMemo(() => {
    const rawIncome = parseInt(income.replace(/\D/g, ""), 10) || 0;
    const effectiveHours = customHours ? parseInt(customHours, 10) || 1 : workHours;
    if (effectiveHours <= 0 || rawIncome <= 0) return 0;
    return Math.round(rawIncome / effectiveHours);
  }, [income, workHours, customHours]);

  const toggleSymptom = (symptomId) => {
    setIsHealthy(false);
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((s) => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const toggleHealthy = () => {
    setIsHealthy(true);
    setSelectedSymptoms([]);
  };

  const handleIncomeChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setIncome("");
      return;
    }
    setIncome(new Intl.NumberFormat("id-ID").format(parseInt(rawVal, 10)));
  };

  const handleVoiceResult = (transcript) => {
    const lower = transcript.toLowerCase();
    setVoiceNotice(`Mendengar: "${transcript}"`);

    let detectedCount = 0;
    SYMPTOM_OPTIONS.forEach((item) => {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        setSelectedSymptoms((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id]
        );
        setIsHealthy(false);
        detectedCount++;
      }
    });

    if (
      lower.includes("sehat") ||
      lower.includes("bugar") ||
      lower.includes("aman") ||
      lower.includes("tidak ada keluhan")
    ) {
      setIsHealthy(true);
      setSelectedSymptoms([]);
    } else if (detectedCount === 0) {
      setAlertInfo({
        type: "info",
        message: `Suara terekam: "${transcript}". Silakan ketuk chip keluhan yang sesuai jika belum terpilih.`,
      });
    }
  };

  const handleResetForm = () => {
    setEditingLogId(null);
    setKunciTerpilih(null);
    setWorkHours(8);
    setCustomHours("");
    setIncome("250.000");
    setIsHealthy(true);
    setSelectedSymptoms([]);
    setAlertInfo({ type: "", message: "" });
    setVoiceNotice("");
  };

  const handleEditClick = (log) => {
    setEditingLogId(log.id);
    setWorkHours(log.workHours);
    setCustomHours(log.workHours > 12 ? String(log.workHours) : "");
    setIncome(log.income ? new Intl.NumberFormat("id-ID").format(log.income) : "");
    if (log.symptoms?.includes("Bebas Keluhan & Bugar") || log.symptoms?.length === 0) {
      setIsHealthy(true);
      setSelectedSymptoms([]);
    } else {
      setIsHealthy(false);
      setSelectedSymptoms(log.symptoms || []);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (logId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan log ini?")) return;
    try {
      setIsLoading(true);
      const res = await api.delete(`/api/logs/${logId}`);
      if (res.data?.success) {
        setAlertInfo({ type: "success", message: "Catatan log berhasil dihapus." });
        fetchLogs();
      }
    } catch (err) {
      setAlertInfo({
        type: "error",
        message: err.response?.data?.error || "Gagal menghapus log.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLog = async (e) => {
    if (e) e.preventDefault();
    setAlertInfo({ type: "", message: "" });

    const finalHours = customHours ? parseInt(customHours, 10) : workHours;
    const cleanIncome = income ? parseInt(income.replace(/\D/g, ""), 10) : null;
    const finalSymptoms = isHealthy ? ["Bebas Keluhan & Bugar"] : selectedSymptoms;

    if (isNaN(finalHours) || finalHours < 0 || finalHours > 24) {
      setAlertInfo({
        type: "error",
        message: "Durasi jam kerja harus di antara 0 hingga 24 jam sehari.",
      });
      return;
    }

    try {
      setIsLoading(true);
      let res;
      if (editingLogId) {
        res = await api.put(`/api/logs/${editingLogId}`, {
          workHours: finalHours,
          income: cleanIncome,
          symptoms: finalSymptoms,
        });
      } else {
        res = await api.post("/api/logs", {
          workHours: finalHours,
          income: cleanIncome,
          symptoms: finalSymptoms,
        });
      }

      if (res.data?.success) {
        setAlertInfo({
          type: "success",
          message: editingLogId
            ? "Catatan log berhasil diperbarui."
            : "Catatan shift dan kondisi kesehatan berhasil disimpan.",
        });
        handleResetForm();
        fetchLogs();
      } else {
        setAlertInfo({
          type: "error",
          message: res.data?.error || "Gagal menyimpan log.",
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setAlertInfo({
          type: "error",
          message: "Sesi login berakhir. Silakan login kembali.",
        });
        setTimeout(() => navigate("/login"), 1500);
        return;
      }
      setAlertInfo({
        type: "error",
        message: err.response?.data?.error || "Terjadi kendala saat menghubungi server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLog = async () => {
    setAlertInfo({ type: "", message: "" });
    try {
      setIsLoading(true);
      const res = await api.post("/api/logs/quick-log");
      if (res.data?.success) {
        setAlertInfo({ type: "success", message: "Log kemarin berhasil disalin." });
        fetchLogs();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setAlertInfo({
        type: "error",
        message: err.response?.data?.error || "Gagal menyalin log kemarin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Mitra";
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const stripMingguan = useMemo(() => {
    const hariIni = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hariIni);
      d.setDate(hariIni.getDate() - (6 - i));
      return {
        tanggal: d,
        inisial: new Intl.DateTimeFormat("id-ID", { weekday: "narrow" }).format(d),
        isToday: i === 6,
        adaLog: recentLogs.some(
          (log) => new Date(log.createdAt).toDateString() === d.toDateString()
        ),
      };
    });
  }, [recentLogs]);

  // Navigator strip: hari aktif + aksi ketuk hari (edit bila ada log,
  // reset form + pesan jujur bila kosong — catatan baru selalu hari ini).
  const kunciHariIni = new Date().toDateString();
  const kunciAktif = kunciTerpilih ?? kunciHariIni;

  const handlePilihHari = (hari) => {
    const kunci = hari.tanggal.toDateString();
    setKunciTerpilih(kunci);
    const log = recentLogs.find(
      (l) => new Date(l.createdAt).toDateString() === kunci
    );
    if (log) {
      handleEditClick(log);
      return;
    }
    handleResetForm();
    const label = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(hari.tanggal);
    setAlertInfo({
      type: "info",
      message:
        kunci === kunciHariIni
          ? "Belum ada catatan hari ini — isi form untuk mencatat shift Anda."
          : `Belum ada catatan pada ${label} — catatan baru selalu tersimpan untuk hari ini.`,
    });
  };

  const logHariIni = recentLogs.find(
    (log) => new Date(log.createdAt).toDateString() === new Date().toDateString()
  );

  const bulanLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const tambahPendapatan = (tambahan) => {
    const sekarang = parseInt(income.replace(/\D/g, ""), 10) || 0;
    setIncome(new Intl.NumberFormat("id-ID").format(sekarang + tambahan));
  };

  const waktuCatat = logHariIni
    ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(logHariIni.createdAt)
      ) + " WIB"
    : "Belum tercatat";

  const judulShift = logHariIni
    ? `Operasional ${logHariIni.workHours} Jam`
    : "Catat shift hari ini";

  const detailShift = logHariIni
    ? `Rp ${Number(logHariIni.income || 0).toLocaleString("id-ID")} • ${
        logHariIni.symptoms?.length > 0
          ? logHariIni.symptoms.join(", ")
          : "Bebas keluhan"
      }`
    : latestLog
    ? "Isi form di bawah, atau salin catatan kemarin."
    : "Belum ada catatan sebelumnya.";

  return (
    <div className="w-full">
      {/* Hero judul di atas gradien pine */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-6 pt-6 text-white lg:px-12 lg:pt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {todayFormatted}
            </span>
            <h1 className="mt-2 text-[27px] font-bold leading-[1.25] tracking-tight lg:text-[34px]">
              Log Kerja &amp; Kebugaran
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/70 font-body">
              Halo {userName}, presensi ritme kerja harian dan evaluasi titik
              ketegangan ergonomis.
            </p>
          </div>

          {editingLogId && (
            <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Mengedit catatan
              <button
                type="button"
                onClick={handleResetForm}
                className="underline decoration-white/40 underline-offset-2"
              >
                Batal
              </button>
            </span>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 pb-14 lg:px-12">
        {/* Notifikasi alert — kartu solid agar tetap terbaca di atas hero gelap */}
        {alertInfo.message && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-card ${
              alertInfo.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-border-subtle bg-surface-card"
            }`}
            role="status"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                alertInfo.type === "success"
                  ? "bg-primary/10 text-primary"
                  : alertInfo.type === "info"
                  ? "bg-surface-subtle text-text-muted"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {alertInfo.type === "success"
                  ? "check_circle"
                  : alertInfo.type === "info"
                  ? "info"
                  : "error"}
              </span>
            </span>
            <p
              className={`min-w-0 flex-1 pt-1 text-[13px] font-semibold leading-snug ${
                alertInfo.type === "error" ? "text-red-800" : "text-text-primary"
              }`}
            >
              {alertInfo.message}
            </p>
            <button
              type="button"
              onClick={() => setAlertInfo({ type: "", message: "" })}
              className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          {/* KIRI: timeline, status hari ini, riwayat sesi (urut sesuai DOM). */}
          <div className="flex flex-col gap-5 lg:col-span-5 lg:gap-6">
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                  Timeline
                </h2>
                <span className="text-[11px] font-medium text-text-muted">
                  {bulanLabel}
                </span>
              </div>

              <div className="grid grid-cols-7 items-start text-center">
                {stripMingguan.map((hari) => {
                  const kunci = hari.tanggal.toDateString();
                  const aktif = kunci === kunciAktif;
                  const label = new Intl.DateTimeFormat("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(hari.tanggal);
                  return (
                    <button
                      type="button"
                      key={hari.tanggal.toISOString()}
                      onClick={() => handlePilihHari(hari)}
                      aria-pressed={aktif}
                      aria-label={
                        hari.adaLog
                          ? `Edit catatan ${label}`
                          : `${label}, belum ada catatan`
                      }
                      title={
                        hari.adaLog
                          ? `Edit catatan ${label}`
                          : `${label} — belum ada catatan`
                      }
                      className="flex flex-col items-center gap-1.5 rounded-2xl px-0.5 py-1.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          hari.isToday ? "font-bold text-primary" : "text-text-muted"
                        }`}
                      >
                        {hari.inisial}
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs lg:h-9 lg:w-9 ${
                          hari.isToday
                            ? "bg-primary font-bold text-white shadow-xs"
                            : hari.adaLog
                            ? "bg-surface-subtle font-semibold text-primary"
                            : "font-medium text-text-muted"
                        } ${
                          aktif
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-card"
                            : ""
                        }`}
                      >
                        {hari.tanggal.getDate()}
                      </span>
                      <span className="flex h-1 items-center gap-1">
                        {hari.isToday ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            <span className="h-1 w-1 rounded-full bg-primary" />
                          </>
                        ) : hari.adaLog ? (
                          <span className="h-1 w-1 rounded-full bg-accent-mint" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[11px] leading-snug text-text-muted">
                Ketuk hari untuk melihat / memperbaiki catatan.
              </p>
            </section>

            {/* Kartu status hari ini */}
            <section className="order-2 relative overflow-hidden rounded-4xl bg-primary p-5 text-white shadow-hero lg:order-none lg:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-mint/15 blur-3xl"
              />
              <div className="relative flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-[12px] font-medium text-white/90">
                  Hari Ini
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/70">
                  <span className="material-symbols-outlined text-[15px]">
                    schedule
                  </span>
                  {waktuCatat}
                </span>
              </div>

              <div className="relative mt-5 flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <span className="material-symbols-outlined text-[24px] text-accent-mint">
                    {logHariIni ? "check_circle" : "assignment"}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-tight">
                    {judulShift}
                  </h3>
                  <p className="mt-0.5 truncate text-[12px] text-white/65">
                    {detailShift}
                  </p>
                </div>
              </div>

              {logHariIni ? (
                <div className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-3 text-[13px] font-semibold text-white">
                  <span className="material-symbols-outlined text-[18px] text-accent-mint">
                    check
                  </span>
                  Tercatat
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickLog}
                  disabled={isLoading}
                  className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    history
                  </span>
                  Salin Log Kemarin
                </button>
              )}
            </section>

            {/* Riwayat sesi tercatat — mengisi ruang di bawah kartu status */}
            <section className="order-4 flex flex-col rounded-4xl border border-border-subtle bg-surface-card shadow-card lg:order-none">
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                    Sesi Tercatat
                  </h2>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {recentLogs.length} catatan pada akun Anda
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-text-muted transition-colors hover:text-primary"
                  aria-label="Muat ulang riwayat"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    refresh
                  </span>
                </button>
              </div>

              {recentLogs.length === 0 ? (
                <div className="m-4 rounded-3xl border border-dashed border-border-subtle bg-surface-subtle/50 p-6 text-center">
                  <span className="material-symbols-outlined text-[32px] text-text-muted">
                    calendar_today
                  </span>
                  <p className="mt-2 text-xs font-semibold text-text-muted">
                    Belum ada catatan. Mulai catat shift hari ini!
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col px-4 pb-4 pt-1">
                  {(() => {
                    const JUMLAH_PER_HALAMAN = 3;
                    const totalHalaman = Math.max(
                      1,
                      Math.ceil(recentLogs.length / JUMLAH_PER_HALAMAN)
                    );
                    const halamanSekarang = Math.min(
                      halamanRiwayat,
                      totalHalaman
                    );
                    const awal = (halamanSekarang - 1) * JUMLAH_PER_HALAMAN;
                    const logTampil = recentLogs.slice(
                      awal,
                      awal + JUMLAH_PER_HALAMAN
                    );

                    return (
                      <>
                        <div className="flex flex-col gap-2">
                          {logTampil.map((log) => {
                          const logDate = new Date(log.createdAt);
                          const tanggalRingkas = new Intl.DateTimeFormat("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          }).format(logDate);
                          const jam = new Intl.DateTimeFormat("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(logDate);

                          let statusLabel = "Kondisi optimal";
                          let statusColor = "text-accent-mint";
                          if (log.workHours >= 10) {
                            statusLabel = "Kelelahan tinggi";
                            statusColor = "text-status-alert";
                          } else if (log.workHours >= 8) {
                            statusLabel = "Perlu peregangan";
                            statusColor = "text-amber-600";
                          }

                          return (
                            <div
                              key={log.id}
                              className="rounded-2xl border border-border-subtle/70 bg-surface-subtle/70 p-3.5"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-card text-primary shadow-xs">
                                  <span className="material-symbols-outlined text-[18px]">
                                    two_wheeler
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <p className="truncate text-[13px] font-semibold text-text-primary">
                                      Shift {log.workHours} jam
                                    </p>
                                    <span className="shrink-0 text-xs font-semibold text-text-primary">
                                      Rp{" "}
                                      {Number(log.income || 0).toLocaleString("id-ID")}
                                    </span>
                                  </div>

                                  <div className="mt-0.5 flex items-center justify-between gap-1">
                                    <p className="min-w-0 truncate text-[11px] text-text-muted">
                                      {tanggalRingkas} • {jam} WIB
                                    </p>
                                    <div className="-mr-1 flex shrink-0 items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleEditClick(log)}
                                        title="Edit catatan ini"
                                        className="rounded-full p-1 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          edit
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClick(log.id)}
                                        title="Hapus catatan ini"
                                        className="rounded-full p-1 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          delete
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  <p className="mt-1 truncate text-[11px] text-text-muted">
                                    <span className={`font-medium ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                    <span className="mx-1.5">·</span>
                                    {log.symptoms && log.symptoms.length > 0
                                      ? log.symptoms.join(", ")
                                      : "Bebas keluhan"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>

                          {totalHalaman > 1 && (
                            <div className="mt-auto flex items-center justify-center gap-2 border-t border-border-subtle pt-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setHalamanRiwayat((prev) =>
                                    Math.max(1, prev - 1)
                                  )
                                }
                                disabled={halamanSekarang === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-text-muted transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Halaman sebelumnya"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  chevron_left
                                </span>
                              </button>
                              <span className="text-[11px] font-semibold text-text-muted">
                                {halamanSekarang} / {totalHalaman}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setHalamanRiwayat((prev) =>
                                    Math.min(totalHalaman, prev + 1)
                                  )
                                }
                                disabled={halamanSekarang === totalHalaman}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-text-muted transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Halaman berikutnya"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  chevron_right
                                </span>
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                </div>
              )}
            </section>
          </div>

          {/* KANAN: form catatan hari ini */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSaveLog}
              className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                    Catatan Hari Ini
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Parameter kerja dan kondisi fisik setelah shift.
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary">
                  <span className="material-symbols-outlined text-[19px]">
                    edit_note
                  </span>
                </span>
              </div>

              <div className="space-y-6">
                {/* Durasi */}
                <div>
                  <span className="mb-2.5 block text-[13px] font-medium text-text-muted">
                    Durasi Operasi
                  </span>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {HOUR_PRESETS.map((preset) => {
                      const isSelected = workHours === preset.hours && !customHours;
                      return (
                        <button
                          key={preset.hours}
                          type="button"
                          onClick={() => {
                            setWorkHours(preset.hours);
                            setCustomHours("");
                          }}
                          className={`rounded-2xl px-1 py-2.5 text-xs transition-colors ${
                            isSelected
                              ? "bg-primary font-semibold text-white shadow-xs"
                              : "bg-surface-subtle font-medium text-text-muted hover:bg-surface-container"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-text-muted">
                    <span className="shrink-0">Atau durasi lain:</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={customHours}
                      onChange={(e) => {
                        setCustomHours(e.target.value);
                        if (e.target.value) setWorkHours(parseInt(e.target.value, 10));
                      }}
                      placeholder="Misal: 6"
                      className="w-24 shrink-0 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-bold text-text-primary placeholder:font-normal placeholder:text-text-muted focus:border-accent-mint focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="shrink-0">jam</span>
                  </div>
                </div>

                {/* Pendapatan */}
                <div>
                  <span className="mb-2.5 block text-[13px] font-medium text-text-muted">
                    Pendapatan Bersih{" "}
                    <span className="font-normal text-text-muted">(opsional)</span>
                  </span>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-4 text-sm font-semibold text-text-muted">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={income}
                      onChange={handleIncomeChange}
                      placeholder="0"
                      className="w-full rounded-full border border-border-subtle bg-surface-subtle py-3 pl-11 pr-4 text-[15px] font-bold text-text-primary placeholder:font-semibold placeholder:text-text-muted focus:border-accent-mint focus:bg-surface-card focus:outline-none"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {[20000, 50000, 100000].map((nominal) => (
                      <button
                        key={nominal}
                        type="button"
                        onClick={() => tambahPendapatan(nominal)}
                        className="rounded-full bg-surface-subtle px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:bg-surface-container"
                      >
                        +{nominal / 1000}rb
                      </button>
                    ))}
                  </div>

                  {incomePerHour > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="material-symbols-outlined text-[16px] text-accent-mint">
                        insights
                      </span>
                      <span>
                        Rata-rata{" "}
                        <span className="font-semibold text-text-primary">
                          Rp {incomePerHour.toLocaleString("id-ID")}
                        </span>{" "}
                        per jam
                      </span>
                    </p>
                  )}
                </div>

                {/* Kondisi fisik */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-text-muted">
                      Kondisi Fisik
                    </span>
                    <div className="flex items-center gap-1.5">
                      <VoiceInput
                        onResult={handleVoiceResult}
                        onError={(err) => setAlertInfo({ type: "error", message: err })}
                        buttonClassName="!p-2 !w-9 !h-9"
                        showStatus={false}
                      />
                      <span className="text-[11px] font-semibold text-text-muted">
                        Bicara
                      </span>
                    </div>
                  </div>

                  {voiceNotice && (
                    <div className="mb-3 flex items-center justify-between rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">
                      <span className="truncate font-medium">{voiceNotice}</span>
                      <button
                        type="button"
                        onClick={() => setVoiceNotice("")}
                        className="ml-2 shrink-0 text-[11px] font-bold underline"
                      >
                        Tutup
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={toggleHealthy}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition-colors ${
                        isHealthy
                          ? "bg-primary font-semibold text-white shadow-xs"
                          : "bg-surface-subtle font-medium text-text-muted hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        mood
                      </span>
                      Bebas keluhan
                    </button>

                    {SYMPTOM_OPTIONS.map((item) => {
                      const isSelected = selectedSymptoms.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleSymptom(item.id)}
                          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition-colors ${
                            isSelected
                              ? "bg-primary font-semibold text-white shadow-xs"
                              : "bg-surface-subtle font-medium text-text-muted hover:bg-surface-container"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-7 border-t border-border-subtle pt-5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-primary px-6 py-4 text-[15px] font-semibold tracking-wide text-white shadow-xs transition-transform hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? "Menyimpan…"
                    : editingLogId
                    ? "Simpan Perubahan"
                    : "Simpan Catatan Harian"}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="mx-auto mt-2 block rounded-full px-4 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-subtle"
                >
                  Atur ulang form
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

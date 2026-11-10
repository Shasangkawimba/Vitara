// ============================================================
// client/src/pages/Logger/Logger.jsx
// Halaman Pencatatan Kesehatan Kerja Harian (Work-Health Logger).
// Mengacu presisi pada rancangan Stitch AI "VITARA Occupational Health PWA UI/UX".
// Fitur: Form Input, Quick Log (<30 dtk), Voice Input (P4), Riwayat CRUD Log.
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import VitaraLogo from "../../components/VitaraLogo";
import VoiceInput from "../../components/VoiceInput";

// Daftar keluhan fisik sesuai rancangan desain Stitch dan dialek/slang pengemudi
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
  { hours: 0, label: "0 Jam", badge: "Libur" },
  { hours: 4, label: "4 Jam", badge: "Ringan" },
  { hours: 8, label: "8 Jam", badge: "Standar" },
  { hours: 10, label: "10 Jam", badge: "Padat" },
  { hours: 12, label: "12+ Jam", badge: "Lembur" },
];

export default function Logger() {
  const navigate = useNavigate();

  // Data Pengguna Aktif
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // State Form Input
  const [editingLogId, setEditingLogId] = useState(null); // Jika sedang edit
  const [workHours, setWorkHours] = useState(8);
  const [customHours, setCustomHours] = useState("");
  const [income, setIncome] = useState("250.000");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isHealthy, setIsHealthy] = useState(true);

  // State Feedback & Histori Log
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: "", message: "" });
  const [recentLogs, setRecentLogs] = useState([]);
  const [latestLog, setLatestLog] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState("");

  // Ambil daftar riwayat log dari backend
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/logs");
      if (res.data?.success) {
        const logs = res.data.data || [];
        setRecentLogs(logs);
        if (logs.length > 0) {
          setLatestLog(logs[0]);
        }
      }
    } catch {
      // Abaikan jika server belum terhubung
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Hitung rata-rata pendapatan per jam secara dinamis
  const incomePerHour = useMemo(() => {
    const rawIncome = parseInt(income.replace(/\D/g, ""), 10) || 0;
    const effectiveHours = customHours ? parseInt(customHours, 10) || 1 : workHours;
    if (effectiveHours <= 0 || rawIncome <= 0) return 0;
    return Math.round(rawIncome / effectiveHours);
  }, [income, workHours, customHours]);

  // Handler Pilihan Gejala
  const toggleSymptom = (symptomId) => {
    setIsHealthy(false);
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((s) => s !== symptomId) : [...prev, symptomId]
    );
  };

  // Handler Bebas Keluhan
  const toggleHealthy = () => {
    setIsHealthy(true);
    setSelectedSymptoms([]);
  };

  // Handler Input Penghasilan Format Ribuan
  const handleIncomeChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setIncome("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(rawVal, 10));
    setIncome(formatted);
  };

  // Handler Callback Voice Input dari komponen P4
  const handleVoiceResult = (transcript) => {
    const lower = transcript.toLowerCase();
    setVoiceNotice(`Mendengar: "${transcript}"`);

    // Deteksi keluhan dari transkrip suara
    let detectedCount = 0;
    SYMPTOM_OPTIONS.forEach((item) => {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        setSelectedSymptoms((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        setIsHealthy(false);
        detectedCount++;
      }
    });

    if (lower.includes("sehat") || lower.includes("bugar") || lower.includes("aman") || lower.includes("tidak ada keluhan")) {
      setIsHealthy(true);
      setSelectedSymptoms([]);
    } else if (detectedCount === 0) {
      setAlertInfo({
        type: "info",
        message: `Suara terekam: "${transcript}". Silakan ketuk chip keluhan yang sesuai jika belum terpilih.`,
      });
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setEditingLogId(null);
    setWorkHours(8);
    setCustomHours("");
    setIncome("250.000");
    setIsHealthy(true);
    setSelectedSymptoms([]);
    setAlertInfo({ type: "", message: "" });
    setVoiceNotice("");
  };

  // Muat data log ke dalam form untuk di-edit (Update)
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

  // Hapus log dari riwayat (Delete)
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

  // Simpan / Perbarui Log (Create / Update)
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
        // Mode Update (PUT)
        res = await api.put(`/api/logs/${editingLogId}`, {
          workHours: finalHours,
          income: cleanIncome,
          symptoms: finalSymptoms,
        });
      } else {
        // Mode Create (POST)
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
            ? "Catatan log berhasil diperbarui! ✨"
            : "Catatan shift dan kondisi kesehatan berhasil disimpan! 👍",
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

  // Quick Log: Duplikasi Log Kemarin (<30 detik)
  const handleQuickLog = async () => {
    setAlertInfo({ type: "", message: "" });
    try {
      setIsLoading(true);
      const res = await api.post("/api/logs/quick-log");
      if (res.data?.success) {
        setAlertInfo({
          type: "success",
          message: "Log kemarin berhasil disalin secara instan! ⚡",
        });
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

  return (
    <div className="font-sans text-slate-800 flex flex-col antialiased">
      {/* Main Content Area */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
        {/* Banner Salam & Tanggal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {todayFormatted}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Halo, {userName}! 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Catat jam kerja dan keluhan fisik hari ini dalam waktu &lt;30 detik.
            </p>
          </div>

          {editingLogId && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-medium">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Sedang Mengedit Catatan Log</span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="underline font-bold ml-1 hover:text-amber-900"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Notifikasi Alert */}
        {alertInfo.message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-3 shadow-xs ${
              alertInfo.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : alertInfo.type === "info"
                ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {alertInfo.type === "success"
                ? "check_circle"
                : alertInfo.type === "info"
                ? "info"
                : "error"}
            </span>
            <span className="flex-1">{alertInfo.message}</span>
            <button
              type="button"
              onClick={() => setAlertInfo({ type: "", message: "" })}
              className="text-text-soft hover:text-text-main"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Tombol Quick Log ("Gunakan Data Kemarin") */}
        <button
          type="button"
          onClick={handleQuickLog}
          disabled={isLoading}
          className="w-full relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-white hover:bg-primary/15 active:scale-[0.99] border border-primary/25 rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between group shadow-xs cursor-pointer disabled:opacity-60"
        >
          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  Fitur Cepat &lt;30 Detik
                </span>
                <span className="text-[11px] text-text-soft font-semibold hidden sm:inline">
                  • Salin Log Kemarin
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text-main font-display leading-tight">
                Sama Seperti Kemarin
              </h2>
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                {latestLog
                  ? `${latestLog.workHours} Jam Kemudi • Rp ${Number(latestLog.income || 0).toLocaleString("id-ID")} • `
                  : "8 Jam Kemudi • Rp 250.000 • "}
                <span className="text-primary font-bold">
                  {latestLog && latestLog.symptoms?.length > 0
                    ? latestLog.symptoms.join(", ")
                    : "Bebas Keluhan & Bugar"}
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105 shadow-inner">
              <span className="material-symbols-outlined text-[26px]">history</span>
            </div>
          </div>
        </button>

        {/* Divider Form Mandiri */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border-subtle"></div>
          <span className="text-[11px] font-bold text-text-soft uppercase tracking-wider">
            Atau Isi Detail Mandiri
          </span>
          <div className="flex-1 h-px bg-border-subtle"></div>
        </div>

        {/* Grid Dual Column di Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* KOLOM KIRI: Operasional Shift (Langkah 1/2) */}
          <div className="flex flex-col gap-4">
            {/* Card Jam Kerja */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-main">Operasional Shift</h3>
                    <p className="text-[11px] text-text-soft">Langkah 1/2: Durasi Kemudi Hari Ini</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {workHours} Jam Aktif
                </span>
              </div>

              {/* Preset Tombol Jam */}
              <div className="grid grid-cols-4 gap-2 pt-1">
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
                      className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary border-2 border-primary text-white shadow-xs"
                          : "border border-border-subtle bg-surface-muted text-text-muted hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? "text-cyan-200" : "text-text-soft"
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Input Jam Kustom */}
              <div className="pt-1 flex items-center gap-2 text-xs text-text-soft">
                <span>Atau masukkan durasi kustom:</span>
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
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-muted text-xs font-bold text-text-main focus:outline-none focus:border-primary"
                />
                <span>Jam</span>
              </div>
            </div>

            {/* Card Pendapatan Harian */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-main">Penghasilan Bersih (Rp)</h3>
                    <p className="text-[11px] text-text-soft">Estimasi setelah potongan komisi (opsional)</p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center mt-1">
                <span className="absolute left-3.5 text-sm font-bold text-text-soft pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={income}
                  onChange={handleIncomeChange}
                  placeholder="Contoh: 250.000"
                  className="w-full h-12 pl-11 pr-4 bg-surface-muted border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm font-bold text-text-main placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Rata-rata pendapatan per jam (Kalkulasi dinamis dari desain Stitch) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-text-soft">
                  <span className="material-symbols-outlined text-[17px] text-primary">insights</span>
                  <span>Rata-rata Pendapatan</span>
                </div>
                <span className="font-bold text-primary font-display">
                  Rp {incomePerHour.toLocaleString("id-ID")} / Jam
                </span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Kondisi Fisik & Keluhan Otot (Langkah 2/2) */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">cardiology</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-main">Kondisi & Keluhan Tubuh</h3>
                    <p className="text-[11px] text-text-soft">Langkah 2/2: Ketuk chip atau gunakan suara</p>
                  </div>
                </div>

                {/* Integrasi Komponen VoiceInput dari P4 */}
                <div className="flex items-center gap-1.5">
                  <VoiceInput
                    onResult={handleVoiceResult}
                    onError={(err) => setAlertInfo({ type: "error", message: err })}
                    buttonClassName="!p-2 !w-9 !h-9"
                    showStatus={false}
                  />
                  <span className="text-[11px] font-bold text-text-soft">Bicara</span>
                </div>
              </div>

              {/* Notifikasi Voice Recording */}
              {voiceNotice && (
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-between">
                  <span className="font-medium italic">{voiceNotice}</span>
                  <button
                    type="button"
                    onClick={() => setVoiceNotice("")}
                    className="underline text-[11px] font-bold"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* Chip Bebas Keluhan (Sehat & Bugar) */}
              <button
                type="button"
                onClick={toggleHealthy}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isHealthy
                    ? "border-2 border-primary bg-primary/10 text-primary shadow-xs"
                    : "border border-border-subtle bg-surface-muted text-text-main hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[22px] text-primary">
                    verified
                  </span>
                  <div className="text-left">
                    <span className="text-xs font-bold block">Bebas Keluhan & Bugar</span>
                    <span className="text-[10px] text-text-soft">
                      Tidak ada nyeri otot lumbal, bahu kaku, atau letih berlebih
                    </span>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-primary transition-opacity ${
                    isHealthy ? "opacity-100" : "opacity-0"
                  }`}
                >
                  check
                </span>
              </button>

              <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider pt-1">
                Atau Pilih Titik Keluhan Fisik:
              </span>

              {/* Grid 6 Titik Keluhan Fisik dari Desain Stitch */}
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOM_OPTIONS.map((item) => {
                  const isSelected = selectedSymptoms.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSymptom(item.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-border-subtle bg-surface-muted text-text-main hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start gap-1.5 overflow-hidden">
                        <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                          {item.icon}
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-bold block leading-tight truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-text-soft block truncate">
                            {item.subLabel}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[16px] text-primary shrink-0 transition-opacity ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        check
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tombol Aksi Form */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 h-12 rounded-xl border border-border-subtle bg-slate-100 hover:bg-slate-200 text-xs font-bold text-text-muted transition-all cursor-pointer"
                >
                  Atur Ulang
                </button>
                <button
                  type="button"
                  onClick={handleSaveLog}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-display font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {editingLogId ? "save" : "check_circle"}
                  </span>
                  <span>{editingLogId ? "Simpan Perubahan Log" : "Simpan Catatan Log"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION RIWAYAT 3 HARI TERAKHIR (CRUD Read, Update, Delete) */}
        <section className="mt-4 bg-white rounded-2xl p-5 border border-border-subtle shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">history_toggle_drop</span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-text-main">Riwayat Catatan Shift & Pemulihan</h3>
                <p className="text-xs text-text-soft">Histori ketegangan otot dan jam kerja Anda</p>
              </div>
            </div>
            <span className="text-xs font-bold text-text-soft">
              Total {recentLogs.length} Catatan
            </span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center bg-surface-muted/40 rounded-xl border border-dashed border-border-subtle">
              <span className="material-symbols-outlined text-[36px] text-text-soft">
                calendar_today
              </span>
              <p className="text-xs font-semibold text-text-soft mt-2">
                Belum ada catatan log tersimpan. Mulai catat shift hari ini!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentLogs.slice(0, 5).map((log) => {
                const logDate = new Date(log.createdAt);
                const dayName = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(logDate);
                const dayNum = logDate.getDate();

                // Evaluasi status kelelahan berdasarkan jam kerja
                let badgeLabel = "Kondisi Optimal";
                let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                if (log.workHours >= 10) {
                  badgeLabel = "Kelelahan Tinggi";
                  badgeColor = "bg-red-50 text-red-700 border-red-200";
                } else if (log.workHours >= 8) {
                  badgeLabel = "Perlu Peregangan";
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                }

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-border-subtle hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-muted/30"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Tanggal Badge */}
                      <div className="w-11 h-11 rounded-xl bg-white border border-border-subtle flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-[10px] font-bold text-text-soft uppercase leading-none">
                          {dayName}
                        </span>
                        <span className="text-sm font-extrabold text-primary leading-none mt-0.5">
                          {dayNum}
                        </span>
                      </div>

                      {/* Detail Shift & Keluhan */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-text-main">
                            {log.workHours} Jam Kemudi
                          </span>
                          <span className="text-text-soft text-xs">•</span>
                          <span className="text-xs font-semibold text-text-soft">
                            Rp {Number(log.income || 0).toLocaleString("id-ID")}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-text-soft mt-0.5">
                          Keluhan:{" "}
                          <span className="font-medium text-text-main">
                            {log.symptoms && log.symptoms.length > 0
                              ? log.symptoms.join(", ")
                              : "Bebas Keluhan"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Aksi Edit & Hapus (Full CRUD) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleEditClick(log)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition flex items-center gap-1 cursor-pointer"
                        title="Edit log ini"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(log.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-1 cursor-pointer"
                        title="Hapus log ini"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-2 pt-4 pb-2 px-2 text-center border-t border-border-subtle">
          <p className="text-xs text-text-soft font-medium tracking-tight">
            © 2024 VITARA Driver Ergonomics & Health System
          </p>
          <div className="mt-1 text-[11px] text-text-soft font-normal flex justify-center items-center gap-2 flex-wrap">
            <span className="hover:text-text-main transition-colors cursor-pointer">Panduan K3</span>
            <span>•</span>
            <span className="hover:text-text-main transition-colors cursor-pointer">Pusat Bantuan</span>
            <span>•</span>
            <span className="hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 text-red-600 font-bold">
              <span className="material-symbols-outlined text-[14px]">call</span>
              Darurat Medis 119
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

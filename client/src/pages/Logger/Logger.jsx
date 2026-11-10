// ============================================================
// client/src/pages/Logger/Logger.jsx
// Halaman Pencatatan Kesehatan Kerja Harian (Work-Health Logger).
// Diadaptasi presisi dari rancangan Stitch UI/UX Mobile PWA.
// Dikelola oleh P1 (Auth & Logger).
// ============================================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import VitaraLogo from "../../components/VitaraLogo";

const COMMON_SYMPTOMS = [
  "Sakit Pinggang",
  "Bahu Kaku",
  "Pusing / Sakit Kepala",
  "Mata Lelah",
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
  const [workHours, setWorkHours] = useState(8);
  const [customHours, setCustomHours] = useState("");
  const [income, setIncome] = useState("250.000");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isHealthy, setIsHealthy] = useState(true);

  // State Suara & Aksi
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: "", message: "" });
  const [lastLog, setLastLog] = useState(null);

  // Muat histori log terakhir untuk fitur Quick Log
  useEffect(() => {
    const fetchLatestLog = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/api/logs");
        if (res.data?.success && res.data.data?.length > 0) {
          setLastLog(res.data.data[0]);
        }
      } catch {
        // Fallback jika API logs belum aktif / data masih kosong
      }
    };
    fetchLatestLog();
  }, []);

  // Handler Pilihan Gejala
  const toggleSymptom = (symptom) => {
    setIsHealthy(false);
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  // Handler Pilihan Bebas Keluhan
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

  // Handler Simpan Log Manual
  const handleSaveLog = async (e) => {
    if (e) e.preventDefault();
    setAlertInfo({ type: "", message: "" });

    const finalHours = customHours ? parseInt(customHours, 10) : workHours;
    const cleanIncome = income ? parseInt(income.replace(/\./g, ""), 10) : null;
    const finalSymptoms = isHealthy ? ["Bebas Keluhan (Sehat)"] : selectedSymptoms;

    if (isNaN(finalHours) || finalHours <= 0 || finalHours > 24) {
      setAlertInfo({
        type: "error",
        message: "Durasi jam kerja harus di antara 1 hingga 24 jam.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/api/logs", {
        workHours: finalHours,
        income: cleanIncome,
        symptoms: finalSymptoms,
      });

      if (res.data?.success) {
        setAlertInfo({
          type: "success",
          message: "Log kerja dan kesehatan hari ini berhasil disimpan! 👍",
        });
        setLastLog(res.data.data);
      } else {
        setAlertInfo({
          type: "error",
          message: res.data?.error || "Gagal menyimpan log.",
        });
      }
    } catch (err) {
      // Jika token belum ada, arahkan ke login
      if (err.response?.status === 401) {
        setAlertInfo({
          type: "error",
          message: "Silakan login terlebih dahulu untuk menyimpan data.",
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

  // Handler Quick Log (Salin Log Kemarin)
  const handleQuickLog = async () => {
    setAlertInfo({ type: "", message: "" });
    try {
      setIsLoading(true);
      const res = await api.post("/api/logs/quick-log");
      if (res.data?.success) {
        setAlertInfo({
          type: "success",
          message: "Berhasil menyalin log kemarin secara instan! ⚡",
        });
        setLastLog(res.data.data);
      } else {
        setAlertInfo({
          type: "error",
          message: res.data?.error || "Gagal melakukan Quick Log.",
        });
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

  // Simulasi Voice Input (Minggu 1 Mock -> Siap terhubung ke P4 di Minggu 3)
  const toggleVoiceRecording = () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceText('Mendengarkan: "Pinggang agak pegal setelah macet sore..."');
      // Otomatis tandai sakit pinggang setelah selesai
      setTimeout(() => {
        if (!selectedSymptoms.includes("Sakit Pinggang")) {
          toggleSymptom("Sakit Pinggang");
        }
      }, 1800);
    } else {
      setIsListening(false);
    }
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Mitra";

  return (
    <div className="bg-surface font-sans text-text-main flex flex-col min-h-screen antialiased select-none pb-20">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-border-subtle">
        <div className="h-14 px-4 max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VitaraLogo className="w-7 h-7" showText={true} textClassName="text-base text-primary" />
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-soft border border-border-subtle uppercase shrink-0">
              {user?.occupation || "DRIVER"}
            </span>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full bg-surface-muted border border-border-subtle">
            <span className="text-[12px] font-semibold text-text-main pl-1">{userName}</span>
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-18 px-4 flex flex-col gap-4">
        {/* Greeting */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[20px] font-extrabold text-text-main leading-tight">
              Halo, {userName}! 👋
            </h1>
            <p className="text-[12px] text-text-soft mt-0.5">
              Catat sesi hari ini dalam &lt;30 detik
            </p>
          </div>
        </div>

        {/* Notifikasi Alert */}
        {alertInfo.message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 shadow-xs ${
              alertInfo.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {alertInfo.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertInfo.message}</span>
          </div>
        )}

        {/* Quick Log Button (Sama Seperti Kemarin) */}
        <button
          onClick={handleQuickLog}
          disabled={isLoading}
          type="button"
          className="w-full relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-white hover:bg-primary/10 active:scale-[0.99] border border-primary/20 rounded-2xl p-4 text-left transition-all flex items-center justify-between group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex-1 pr-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  Salin Log Kemarin
                </span>
              </div>
              <h2 className="text-[16px] font-bold text-text-main font-display leading-tight">
                Sama Seperti Kemarin
              </h2>
              <p className="text-[12px] text-text-soft mt-1 leading-relaxed">
                {lastLog
                  ? `${lastLog.workHours} Jam Kemudi • Rp ${Number(lastLog.income || 0).toLocaleString("id-ID")}`
                  : "8 Jam Kemudi • Rp 250.000"}
                <br />
                <span className="text-primary font-semibold font-sans">
                  {lastLog && lastLog.symptoms?.length > 0
                    ? lastLog.symptoms.join(", ")
                    : "Postur Prima • Bebas Keluhan"}
                </span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-subtle"></div>
          <span className="text-[11px] font-semibold text-text-soft uppercase tracking-wider">
            Atau Isi Mandiri
          </span>
          <div className="flex-1 h-px bg-border-subtle"></div>
        </div>

        {/* Form Section 1: Jam Kerja */}
        <div className="bg-white rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
              <label className="text-[13px] font-bold text-text-main">Jam Kerja Hari Ini</label>
            </div>
            <span className="text-[11px] text-text-soft">Durasi kemudi aktif</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[4, 8, 10, 12].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => {
                  setWorkHours(hours);
                  setCustomHours("");
                }}
                className={`h-12 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  workHours === hours && !customHours
                    ? "bg-primary border-2 border-primary text-white shadow-xs"
                    : "border border-border-subtle bg-surface-muted text-text-muted hover:border-primary/40"
                }`}
              >
                {hours} {hours === 12 ? "+ Jam" : "Jam"}
              </button>
            ))}
          </div>
        </div>

        {/* Form Section 2: Penghasilan Hari Ini */}
        <div className="bg-white rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
              <label className="text-[13px] font-bold text-text-main">
                Penghasilan Hari Ini (Rp)
              </label>
            </div>
            <span className="text-[11px] text-text-soft">Opsional / Bersih</span>
          </div>
          <div className="relative flex items-center mt-1">
            <span className="absolute left-3.5 text-[14px] font-bold text-text-soft pointer-events-none">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={income}
              onChange={handleIncomeChange}
              placeholder="Contoh: 250.000"
              className="w-full h-12 pl-11 pr-4 bg-surface-muted border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-[15px] font-bold text-text-main placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Form Section 3: Gejala Fisik + Tombol Suara Mikrofon */}
        <div className="bg-white rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  health_and_safety
                </span>
                <label className="text-[13px] font-bold text-text-main">
                  Kondisi & Gejala Tubuh
                </label>
              </div>
              <p className="text-[11px] text-text-soft mt-0.5">
                Ketuk chip atau rekam via suara
              </p>
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
                isListening
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isListening ? "stop" : "mic"}
              </span>
              <span>{isListening ? "Stop" : "Bicara"}</span>
            </button>
          </div>

          {/* Voice Recording Indicator */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[12px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="font-medium">{voiceText}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsListening(false)}
                className="font-bold underline text-[11px] cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}

          {/* Symptom Chips */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {COMMON_SYMPTOMS.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`h-12 px-3 rounded-xl text-[12px] font-semibold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? "border-2 border-primary bg-primary/10 text-primary font-bold"
                      : "border border-border-subtle bg-surface-muted text-text-main hover:border-primary/30"
                  }`}
                >
                  <span>{symptom}</span>
                  <span
                    className={`material-symbols-outlined text-[18px] text-primary transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    check
                  </span>
                </button>
              );
            })}

            {/* Chip Bebas Keluhan */}
            <button
              type="button"
              onClick={toggleHealthy}
              className={`col-span-2 h-12 px-3 rounded-xl text-[13px] font-bold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${
                isHealthy
                  ? "border-2 border-primary bg-primary/10 text-primary"
                  : "border border-border-subtle bg-surface-muted text-text-main hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                  sentiment_very_satisfied
                </span>
                <span className="truncate">Bebas Keluhan (Sehat)</span>
              </div>
              <span
                className={`material-symbols-outlined text-[18px] text-primary shrink-0 transition-opacity ${
                  isHealthy ? "opacity-100" : "opacity-0"
                }`}
              >
                check
              </span>
            </button>
          </div>
        </div>

        {/* Tombol Simpan Log */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSaveLog}
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-bold text-[14px] rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Menyimpan Log...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Simpan Log</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-2 pt-3 pb-2 px-2 text-center border-t border-border-subtle">
          <p className="text-[12px] text-text-soft font-medium tracking-tight">
            © 2024 VITARA Driver Ergonomics & Health System
          </p>
          <div className="mt-1 text-[11px] text-text-soft font-normal flex justify-center items-center gap-1.5 flex-wrap">
            <span className="hover:text-text-main transition-colors cursor-pointer">
              Panduan K3 Mitra
            </span>
            <span>•</span>
            <span className="hover:text-text-main transition-colors cursor-pointer">
              Pusat Bantuan
            </span>
            <span>•</span>
            <span className="hover:text-text-main transition-colors cursor-pointer">
              Kontak Darurat
            </span>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation Bar (PWA Standard) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border-subtle">
        <div className="flex justify-around items-center h-14 px-2 max-w-lg mx-auto">
          {/* Tab 1: Catat (Active / P1) */}
          <Link
            to="/logger"
            className="flex flex-col items-center justify-center flex-1 h-full text-primary font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
            <span className="text-[11px] mt-0.5">Catat</span>
          </Link>

          {/* Tab 2: Analisis (P3) */}
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center flex-1 h-full text-text-soft hover:text-text-main font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">monitoring</span>
            <span className="text-[11px] mt-0.5">Analisis</span>
          </Link>

          {/* Tab 3: Konsultasi (P2) */}
          <Link
            to="/chat"
            className="flex flex-col items-center justify-center flex-1 h-full text-text-soft hover:text-text-main font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">stethoscope</span>
            <span className="text-[11px] mt-0.5">Konsultasi</span>
          </Link>

          {/* Tab 4: Faskes (P4) */}
          <Link
            to="/finder"
            className="flex flex-col items-center justify-center flex-1 h-full text-text-soft hover:text-text-main font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            <span className="text-[11px] mt-0.5">Faskes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}


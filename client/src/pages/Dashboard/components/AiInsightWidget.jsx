// ============================================================
// client/src/pages/Dashboard/components/AiInsightWidget.jsx
// Widget Integrasi Ergo-Coach AI untuk Dashboard (Milestone Minggu 4)
// Mengambil Risk Score (/api/ai/risk-score) & Weekly Insight (/api/ai/weekly-insight)
// Sesuai spesifikasi API_CONTRACT.md (P2)
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

export const AiInsightWidget = ({ riskScoreData, weeklyInsightData, loading }) => {
  // Evaluasi skor & level risiko dari respons GET /api/ai/risk-score
  // Ambang level sesuai API_CONTRACT.md: skor >= 70 Tinggi, >= 40 Sedang, < 40 Rendah
  const skor = riskScoreData?.skor ?? null;
  const levelApi = riskScoreData?.level ?? null;
  const saranRisk = riskScoreData?.saran ?? null;

  const getRiskDisplay = (score, apiLevel) => {
    if (score === null || score === undefined) {
      return {
        label: "Belum Ada Data",
        textColor: "text-slate-600 dark:text-slate-300",
        bgColor: "bg-slate-50 dark:bg-slate-800/60",
        borderColor: "border-slate-200 dark:border-slate-700",
        barColor: "bg-slate-400",
        pesan: "Catat jam kerja hari ini di Catatan Harian untuk memantau risiko kelelahan Anda.",
      };
    }
    if (score >= 70 || apiLevel === "Risiko Tinggi") {
      return {
        label: "Risiko Tinggi",
        textColor: "text-rose-700 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-950/30",
        borderColor: "border-rose-200 dark:border-rose-800/60",
        barColor: "bg-rose-500",
        pesan: saranRisk || "Beban kerja ekstrem. Sangat disarankan kurangi durasi berkendara hari ini.",
      };
    }
    if (score >= 40 || apiLevel === "Risiko Sedang") {
      return {
        label: "Risiko Sedang",
        textColor: "text-[#c2410c] dark:text-[#c2410c]", // Orange tua
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        barColor: "bg-amber-500",
        badgeBg: "bg-orange-100/90 border-orange-300",
        pesan: saranRisk || "Mulai timbul kelelahan otot. Lakukan peregangan berkala setiap 2 jam berkendara.",
      };
    }
    return {
      label: "Risiko Rendah",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      barColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100/90 border-emerald-300 text-emerald-800",
      pesan: saranRisk || "Kondisi fisik stabil. Pertahankan pola istirahat dan hidrasi cairan.",
    };
  };

  const level = getRiskDisplay(skor, levelApi);

  // Ambil ringkasan dari respons GET /api/ai/weekly-insight
  const ringkasanInsight =
    weeklyInsightData?.ringkasan ||
    weeklyInsightData?.data?.ringkasan ||
    "Evaluasi beban kerja dan keluhan muskuloskeletal mingguan Anda sedang disinkronkan dari riwayat kerja.";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 1. Skor Risiko Harian AI (0 - 100) */}
      <div className={`risk-score-card rounded-xl border p-5 shadow-xs transition-colors ${level.borderColor} ${level.bgColor}`}>
        <div className="flex items-center justify-between">
          <span className="risk-score-label text-xs font-bold uppercase tracking-wider text-slate-700">
            Skor Risiko Kelelahan
          </span>
          <span
            className={`risk-score-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${level.textColor} ${level.badgeBg} shadow-2xs`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c] shrink-0" />
            <span>{level.label}</span>
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          ) : (
            <>
              <span className="risk-score-number text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                {skor !== null ? skor : "—"}
              </span>
              <span className="risk-score-sub text-xs sm:text-sm font-semibold text-slate-500">
                {skor !== null ? "/ 100" : "Belum dinilai"}
              </span>
            </>
          )}
        </div>

        {/* Meter Bar Progress */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${level.barColor}`}
            style={{ width: `${skor !== null ? Math.min(Math.max(skor, 5), 100) : 0}%` }}
          />
        </div>

        <p className="risk-score-desc mt-3 text-xs leading-relaxed text-slate-700">
          {level.pesan}
        </p>
      </div>

      {/* 2. Ringkasan Evaluasi Mingguan AI (Weekly Insight P2) */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weekly Ergo-Insight
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
              Riwayat 14 Hari
            </span>
          </div>

          <div className="mt-3.5">
            {loading ? (
              <div className="space-y-2 py-1">
                <div className="h-3.5 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-5/6 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {ringkasanInsight}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-slate-400 dark:text-slate-400">
            Sumber: Analisis Ergo-Coach AI
          </span>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            <span>Konsultasi Keluhan Lengkap</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AiInsightWidget;

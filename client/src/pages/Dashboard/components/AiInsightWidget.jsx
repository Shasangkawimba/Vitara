// ============================================================
// client/src/pages/Dashboard/components/AiInsightWidget.jsx
// Widget Integrasi Ergo-Coach AI untuk Dashboard (Milestone Minggu 4)
// Mengambil Risk Score (/api/ai/risk-score) & Weekly Insight (/api/ai/weekly-insight)
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

export const AiInsightWidget = ({ riskScore, insight, loading }) => {
  // Tentukan warna & pesan risiko berdasarkan skor 0-100
  const getRiskLevel = (score) => {
    if (score >= 70) {
      return {
        label: "Risiko Tinggi",
        textColor: "text-rose-700",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        barColor: "bg-rose-500",
        pesan: "Beban kerja ekstrem. Sangat disarankan kurangi durasi berkendara hari ini.",
      };
    }
    if (score >= 40) {
      return {
        label: "Risiko Sedang",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        barColor: "bg-amber-500",
        pesan: "Mulai timbul kelelahan otot. Lakukan peregangan tiap 2 jam narik.",
      };
    }
    return {
      label: "Risiko Rendah",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      barColor: "bg-emerald-500",
      pesan: "Kondisi fisik stabil. Pertahankan pola istirahat dan hidrasi cairan.",
    };
  };

  const level = getRiskLevel(riskScore || 35);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Skor Risiko Harian AI (0 - 100) */}
      <div className={`rounded-2xl border p-5 shadow-xs ${level.borderColor} ${level.bgColor}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Skor Risiko Kelelahan
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${level.textColor} bg-white border-current`}
          >
            {level.label}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          {loading ? (
            <div className="h-10 w-20 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <>
              <span className="text-4xl font-black tracking-tight text-slate-900">
                {riskScore ?? 35}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </>
          )}
        </div>

        {/* Meter Bar Progress */}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${level.barColor}`}
            style={{ width: `${Math.min(riskScore || 35, 100)}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-600">
          {level.pesan}
        </p>
      </div>

      {/* 2. Ringkasan Evaluasi Mingguan AI (Weekly Insight P2) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                AI
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Weekly Ergo-Insight
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Dianalisis dari riwayat log Anda
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="space-y-2 py-1">
                <div className="h-3.5 w-3/4 animate-pulse rounded-md bg-slate-200" />
                <div className="h-3.5 w-full animate-pulse rounded-md bg-slate-200" />
                <div className="h-3.5 w-5/6 animate-pulse rounded-md bg-slate-200" />
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-600">
                {insight ||
                  "Jam kerja Anda mencapai puncak di hari Kamis (10 jam) yang berkolerasi langsung dengan timbulnya nyeri punggung bawah. Disarankan menambah waktu jeda 10 menit setiap 3 jam berkendara dan menjaga posisi ergonomis stang motor."}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Sumber: Algoritma Ergo-Coach (P2)
          </span>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
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

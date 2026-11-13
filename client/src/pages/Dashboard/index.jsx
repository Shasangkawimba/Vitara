// ============================================================
// client/src/pages/Dashboard/index.jsx
// Dasbor Produktivitas vs Kesehatan (Occupational Health PWA)
// Dirender sesuai rancangan Stitch AI "Dasbor Analisis Performa"
// Mendukung integrasi P3 (Summary, Korelasi) & P2 (Risk Score, Weekly Insight)
// ============================================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import CorrelationChart from "./components/CorrelationChart";
import AiInsightWidget from "./components/AiInsightWidget";

const formatRupiah = (angka) => {
  if (angka === null || angka === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};

export const DashboardPage = () => {
  const [periode, setPeriode] = useState(7);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [riskScoreData, setRiskScoreData] = useState(null);
  const [weeklyInsightData, setWeeklyInsightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Ambil data aktual dari backend P3 & P2
  const fetchData = async (days) => {
    try {
      setLoading(true);
      setApiError("");

      const [resSummary, resCorr, resTrend, resRisk, resInsight] = await Promise.allSettled([
        api.get(`/api/dashboard/summary?days=${days}`),
        api.get(`/api/dashboard/correlation?days=${days}`),
        api.get(`/api/dashboard/trend?days=${days}`),
        api.get("/api/ai/risk-score"),
        api.get("/api/ai/weekly-insight"),
      ]);

      // 1. Data Summary Dashboard (P3)
      if (resSummary.status === "fulfilled" && resSummary.value.data?.success) {
        setSummary(resSummary.value.data.data);
      } else {
        setSummary({
          totalWorkHours: 0,
          avgIncome: 0,
          totalSymptoms: 0,
          totalLogs: 0,
          periodDays: days,
          hasData: false,
        });
      }

      // 2. Data Grafik Korelasi (P3)
      if (resCorr.status === "fulfilled" && resCorr.value.data?.success) {
        setChartData(resCorr.value.data.data || []);
      } else {
        setChartData([]);
      }

      // 3. Data Tren Metrik (P3)
      if (resTrend.status === "fulfilled" && resTrend.value.data?.success) {
        setTrendData(resTrend.value.data.data);
      } else {
        setTrendData(null);
      }

      // 4. Data Risk Score AI (P2 - API_CONTRACT.md)
      if (resRisk.status === "fulfilled" && resRisk.value.data?.success) {
        setRiskScoreData(resRisk.value.data.data);
      } else {
        setRiskScoreData(null);
      }

      // 5. Data Weekly Insight AI (P2 - API_CONTRACT.md)
      if (resInsight.status === "fulfilled" && resInsight.value.data?.success) {
        setWeeklyInsightData(resInsight.value.data.data);
      } else {
        setWeeklyInsightData(null);
      }
    } catch (e) {
      console.error("[Dashboard] Error saat memuat data:", e);
      setApiError("Gagal menghubungkan ke server untuk mengambil data aktivitas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(periode);
  }, [periode]);

  // Evaluasi skor risiko aktif untuk KPI Card 3
  const activeRiskScore = riskScoreData?.skor ?? null;
  const activeRiskLevel =
    riskScoreData?.level ||
    (activeRiskScore !== null
      ? activeRiskScore >= 70
        ? "Risiko Tinggi"
        : activeRiskScore >= 40
        ? "Risiko Sedang"
        : "Risiko Rendah"
      : "Belum Ada Data");

  // Format tanggal rentang periode dinamis
  const getPeriodLabel = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const f = (d) => `${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`;
    return `${f(start)} - ${f(end)} ${end.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Alert Error State */}
      {apiError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchData(periode)}
            className="underline font-bold text-red-900 hover:text-red-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider text-cyan-800 uppercase bg-cyan-50 border border-cyan-100/60 px-2 py-0.5 rounded">
              KESEHATAN KERJA &amp; PERFORMA
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Produktivitas vs Kesehatan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis korelasi beban jam berkendara dengan keluhan fisik muskuloskeletal.
          </p>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{getPeriodLabel(periode)}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">{periode} Hari</span>
          </div>

          <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => setPeriode(7)}
              className={`rounded-md px-2.5 py-1 transition ${
                periode === 7 ? "bg-white text-cyan-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriode(30)}
              className={`rounded-md px-2.5 py-1 transition ${
                periode === 30 ? "bg-white text-cyan-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </div>

      {/* 1. Top KPI Row: 4 Spacious Minimalist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL JAM KERJA */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL JAM KERJA
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? "..." : (summary?.totalWorkHours ?? 0)}
              </span>
              <span className="text-xs font-medium text-slate-500">Jam / {periode} Hari</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`font-semibold ${trendData?.trenJamKerja?.startsWith("+") ? "text-amber-700" : "text-emerald-700"}`}>
                {trendData?.trenJamKerja || "0%"}
              </span>
              <span className="text-slate-400">vs periode lalu</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rata-rata Harian</span>
            <span className="font-semibold text-slate-700">
              {summary && summary.periodDays
                ? `${(summary.totalWorkHours / summary.periodDays).toFixed(1)} jam/hari`
                : "0 jam/hari"}
            </span>
          </div>
        </div>

        {/* Card 2: PERKIRAAN PENGHASILAN */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              RATA-RATA PENGHASILAN
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? "..." : formatRupiah(summary?.avgIncome || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-emerald-700 font-semibold">
                {summary?.totalLogs ? `${summary.totalLogs} Log Tercatat` : "Belum Ada Log"}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Catatan</span>
            <span className="font-semibold text-slate-700">{summary?.totalLogs ?? 0} Hari</span>
          </div>
        </div>

        {/* Card 3: SKOR RISIKO KELELAHAN (Terhubung dengan P2) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SKOR RISIKO KELELAHAN
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeRiskScore !== null ? activeRiskScore : "—"}
              </span>
              <span className="text-xs text-slate-400">
                {activeRiskScore !== null ? "/ 100" : ""}
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-xs border ${
                activeRiskScore !== null
                  ? activeRiskScore >= 70
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : activeRiskScore >= 40
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeRiskScore !== null
                    ? activeRiskScore >= 70
                      ? "bg-rose-500"
                      : activeRiskScore >= 40
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              ></span>
              <span className="font-semibold text-[11px]">
                {activeRiskLevel}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status Evaluasi</span>
            <span className="font-semibold text-slate-700">
              {activeRiskScore !== null ? "Aktif (P2)" : "Perlu Input Log"}
            </span>
          </div>
        </div>

        {/* Card 4: TOTAL KELUHAN FISIK */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL KELUHAN FISIK
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-cyan-800 tracking-tight">
                {loading ? "..." : (summary?.totalSymptoms ?? 0)}
              </span>
              <span className="text-xs text-slate-500">Gejala</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`font-semibold ${trendData?.trenKeluhan?.startsWith("+") ? "text-rose-700" : "text-emerald-700"}`}>
                {trendData?.trenKeluhan || "0%"}
              </span>
              <span className="text-slate-400">vs periode lalu</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Keluhan Utama</span>
            <span className="font-semibold text-slate-700 truncate max-w-[120px]">
              {trendData?.kategoriKeluhanTerbanyak?.[0] || "Tidak ada"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Split/Grid (Wide Left / Structured Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Korelasi Jam Kerja vs Keluhan Fisik (7 Kolom) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Korelasi Jam Kerja vs Keluhan Fisik
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemantauan jam narik harian terhadap batas aman ergonomi kerja (8 jam) & indikasi gejala.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-700 inline-block"></span>
                  <span>Jam Aman (≤8j)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
                  <span>Lembur Puncak (&gt;8j)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-0.5 bg-slate-300 inline-block border-t border-dashed border-slate-500"></span>
                  <span>Batas 8j</span>
                </div>
              </div>
            </div>

            {/* Visualisasi Grafik Interaktif Recharts */}
            <CorrelationChart data={chartData} loading={loading} />
          </div>

          {/* Kotak Catatan Korelasi */}
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            {chartData && chartData.length > 0 ? (
              (() => {
                const maxHourDay = [...chartData].sort((a, b) => (b.jamKerja || 0) - (a.jamKerja || 0))[0];
                const highLoadDay = maxHourDay && maxHourDay.jamKerja > 8 ? maxHourDay : null;
                const minHourDay = [...chartData].filter((d) => (d.jamKerja || 0) > 0).sort((a, b) => a.jamKerja - b.jamKerja)[0];

                return (
                  <>
                    {highLoadDay ? (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>
                          <strong className="font-semibold text-slate-900">
                            Puncak Beban Terlampaui ({highLoadDay.hari} {highLoadDay.jamKerja} Jam):
                          </strong>{" "}
                          Tercatat {highLoadDay.keluhan || 0} keluhan fisik pada hari dengan jam kerja tertinggi. Disarankan mengambil jeda peregangan saat durasi mendekati 8 jam.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>
                          <strong className="font-semibold text-slate-900">Durasi Kerja Terkendali:</strong> Jam kerja harian berada dalam batas ergonomi aman (&le; 8 jam). Pertahankan pola kerja teratur ini.
                        </p>
                      </div>
                    )}

                    {minHourDay && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>
                          <strong className="font-semibold text-slate-900">Pemulihan / Jam Ringan ({minHourDay.hari}):</strong> Beban kerja minimum ({minHourDay.jamKerja} jam) membantu menurunkan akumulasi kelelahan otot pengemudi.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Belum ada catatan korelasi harian pada periode ini. Catat aktivitas Anda di menu Catatan Harian.</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Wawasan Ergonomi Tubuh (5 Kolom) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Wawasan Ergonomi Tubuh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribusi keluhan fisik aktual berdasarkan riwayat kerja.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-100/60 px-2 py-0.5 rounded">
              Spesialis Okupasi
            </span>
          </div>

          {/* Distribusi Keluhan Berdasarkan Data Aktual WorkLog */}
          {trendData?.ergonomicBreakdown?.hasData ? (
            <div className="space-y-4">
              {trendData.ergonomicBreakdown.categories.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800">{cat.label}</span>
                    <span className="font-bold text-slate-900">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tercatat {cat.count} keluhan fisik pada area ini ({cat.percentage}% dari total keluhan).
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 my-2">
              <span className="material-symbols-outlined text-slate-300 text-3xl mb-1 block">
                vital_signs
              </span>
              <p className="text-xs font-semibold text-slate-700">Belum Ada Keluhan Fisik</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tidak ada keluhan fisik tercatat pada periode ini. Kondisi postur Anda dalam kategori baik!
              </p>
            </div>
          )}

          {/* Micro-break box: Rekomendasi Umum Pencegahan Ergonomi */}
          <div className="p-4 rounded-lg bg-cyan-50/60 border border-cyan-100/80 space-y-1.5">
            <span className="text-xs font-semibold text-cyan-900">
              Rekomendasi Micro-Break (Pencegahan Standar K3)
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lakukan jeda peregangan 3–5 menit setiap 2–3 jam berkendara. Prioritaskan relaksasi otot punggung, bahu, dan pelemasan tungkai kaki untuk menjaga sirkulasi darah tetap optimal.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              to="/reminder"
              className="py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-medium text-center transition-colors shadow-xs"
            >
              Mulai Peregangan 5 Menit
            </Link>
            <Link
              to="/chat"
              className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium text-center transition-colors"
            >
              Konsultasi AI Ergo-Coach
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Section Milestone Minggu 4: Widget AI Ergo-Insight & Risk Score (Integrasi P2) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[20px]">
              psychology
            </span>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              EVALUASI KONDISI &amp; REKOMENDASI KESEHATAN
            </h2>
          </div>
        </div>

        <AiInsightWidget
          riskScoreData={riskScoreData}
          weeklyInsightData={weeklyInsightData}
          loading={loading}
        />
      </section>
    </div>
  );
};

export default DashboardPage;

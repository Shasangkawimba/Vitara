// ============================================================
// client/src/pages/Dashboard/index.jsx
// Dasbor Produktivitas vs Kesehatan (Occupational Health PWA)
// Dirender sesuai rancangan Stitch AI "Dasbor Analisis Performa"
// ============================================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import CorrelationChart from "./components/CorrelationChart";

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
  const [loading, setLoading] = useState(true);

  // Ambil data dari backend (dengan fallback aman sesuai desain Stitch AI)
  const fetchData = async (days) => {
    try {
      setLoading(true);
      const [resSummary, resCorr] = await Promise.allSettled([
        api.get(`/api/dashboard/summary?days=${days}`),
        api.get(`/api/dashboard/correlation?days=${days}`),
      ]);

      if (resSummary.status === "fulfilled" && resSummary.value.data?.success) {
        setSummary(resSummary.value.data.data);
      } else {
        setSummary({
          totalWorkHours: 42.0,
          avgIncome: 1450000,
          riskScore: 65,
          recoveryIndex: 78,
          totalLogs: 7,
          totalOrders: 48,
          peakDay: "Jumat (9.5 jam)",
        });
      }

      if (resCorr.status === "fulfilled" && resCorr.value.data?.success) {
        setChartData(resCorr.value.data.data);
      } else {
        setChartData([
          { hari: "Sen", jamKerja: 6.2, keluhan: 1, isPeak: false, heightPercent: 51 },
          { hari: "Sel", jamKerja: 7.0, keluhan: 1, isPeak: false, heightPercent: 58 },
          { hari: "Rab", jamKerja: 5.5, keluhan: 0, isPeak: false, heightPercent: 45 },
          { hari: "Kam", jamKerja: 6.8, keluhan: 1, isPeak: false, heightPercent: 56 },
          { hari: "Jum", jamKerja: 9.5, keluhan: 3, isPeak: true, heightPercent: 79 },
          { hari: "Sab", jamKerja: 4.0, keluhan: 0, isPeak: false, heightPercent: 33 },
          { hari: "Min", jamKerja: 3.0, keluhan: 0, isPeak: false, heightPercent: 25 },
        ]);
      }
    } catch (e) {
      console.warn("Menggunakan data Stitch AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(periode);
  }, [periode]);

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider text-cyan-800 uppercase bg-cyan-50 border border-cyan-100/60 px-2 py-0.5 rounded">
              KESEHATAN KERJA & PERFORMA • MINGGU KE-21
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
            <span>20 - 26 Mei 2024</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">Mgg 21</span>
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

      {/* 1. Top KPI Row: 4 Spacious Minimalist Cards Sesuai Desain Stitch AI */}
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
                {summary ? `${summary.totalWorkHours}` : "42.0"}
              </span>
              <span className="text-xs font-medium text-slate-500">Jam / 7 Hari</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-emerald-700 font-semibold">+14.2%</span>
              <span className="text-slate-400">vs minggu lalu</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rata-rata Harian</span>
            <span className="font-semibold text-slate-700">6.0 jam/hari</span>
          </div>
        </div>

        {/* Card 2: PERKIRAAN PENGHASILAN */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              PERKIRAAN PENGHASILAN
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {summary ? formatRupiah(summary.avgIncome || 1450000) : "Rp 1.450.000"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-emerald-700 font-semibold">+15.0%</span>
              <span className="text-slate-400">kinerja optimal</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aktivitas Narik</span>
            <span className="font-semibold text-slate-700">48 Tarikan Order</span>
          </div>
        </div>

        {/* Card 3: SKOR RISIKO KELELAHAN */}
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
              <span className="text-2xl font-bold text-slate-900 tracking-tight">65</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-amber-700 text-[11px]">
                Sedang - Waspada Kelelahan
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Puncak Beban</span>
            <span className="font-semibold text-slate-700">Jumat (9.5 jam)</span>
          </div>
        </div>

        {/* Card 4: INDEKS PEMULIHAN */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              INDEKS PEMULIHAN
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-cyan-800 tracking-tight">78%</span>
              <span className="text-xs text-slate-500">stabil</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-emerald-700 font-semibold">Kapasitas Baik</span>
              <span className="text-slate-400">pasca istirahat</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fokus Pantauan</span>
            <span className="font-semibold text-slate-700">Lumbal Bawah</span>
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
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>
                <strong className="font-semibold text-slate-900">Puncak Beban Terlampaui (Jumat 9.5 Jam):</strong> Jam narik berlebih memicu peningkatan nyeri lumbal hingga 40%. Wajib intervensi jeda istirahat berkala.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                <strong className="font-semibold text-slate-900">Pemulihan Efektif (Sabtu - Minggu):</strong> Penurunan jam kerja terbukti mengembalikan indeks ketahanan fisik tubuh ke angka optimal 78%.
              </p>
            </div>
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
                Distribusi beban fisik berdasarkan postur berkendara.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-100/60 px-2 py-0.5 rounded">
              Spesialis Okupasi
            </span>
          </div>

          <div className="space-y-4">
            {/* 1. Lumbal */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-800">Pinggang Bawah (Lumbal)</span>
                <span className="font-bold text-slate-900">40%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "40%" }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Pemicu: Getaran sadel motor dan posisi duduk statis &gt; 2 jam.
              </p>
            </div>

            {/* 2. Bahu & Leher */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-800">Bahu, Leher & Tengkuk</span>
                <span className="font-bold text-slate-900">25%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-700 h-full rounded-full" style={{ width: "25%" }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Pemicu: Beban helm berkelanjutan dan cengkeraman stang kemudi.
              </p>
            </div>

            {/* 3. Lutut */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-800">Lutut & Kaki</span>
                <span className="font-bold text-slate-900">15%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: "15%" }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Pemicu: Menahan beban motor saat berhenti di kemacetan lalu lintas.
              </p>
            </div>
          </div>

          {/* Micro-break box */}
          <div className="p-4 rounded-lg bg-cyan-50/60 border border-cyan-100/80 space-y-1.5">
            <span className="text-xs font-semibold text-cyan-900">
              Rekomendasi Micro-Break
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lakukan jeda peregangan 3–5 menit setiap 3 trip selesai. Prioritaskan relaksasi panggul dan peregangan leher untuk mencegah nyeri muskuloskeletal kronis.
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
    </div>
  );
};

export default DashboardPage;

// ============================================================
// client/src/pages/Dashboard/index.jsx
// Dasbor Produktivitas vs Kesehatan — dibangun ulang mengikuti
// layar Stitch "Dasbor Produktivitas & Kesehatan":
//   • Hero band pine dengan sapaan putih
//   • Timeline mingguan, kartu ringkasan gelap, dua metrik
//   • Kartu grafik lebar + kartu ergonomi
// SEMUA ANGKA BERSUMBER DATA API REAL — tanpa data dummy.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import CorrelationChart from "./components/CorrelationChart";
import { EvaluationCard, ErgoInsightCard } from "./components/AiInsightWidget";

const formatRupiah = (angka) => {
  if (angka === null || angka === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};

const kunciTanggal = (tanggal) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tanggal);

const sapaanHari = () => {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat Pagi";
  if (jam < 15) return "Selamat Siang";
  if (jam < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const bacaNama = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return "Mitra";
    const user = JSON.parse(stored);
    return user?.name ? user.name.trim().split(" ")[0] : "Mitra";
  } catch {
    return "Mitra";
  }
};

/** Label perubahan periode ini vs periode sebelumnya. */
const LabelDelta = ({ persen, terang = false }) => {
  if (persen === null || persen === undefined) {
    return (
      <span className={terang ? "text-white/50" : "text-text-muted"}>
        Periode pertama tercatat
      </span>
    );
  }
  const naik = persen >= 0;
  return (
    <>
      <span
        className={
          naik
            ? terang
              ? "font-semibold text-white"
              : "font-semibold text-primary"
            : terang
            ? "font-semibold text-rose-200"
            : "font-semibold text-status-alert"
        }
      >
        {naik ? "+" : ""}
        {persen.toFixed(1)}%
      </span>
      <span className={terang ? "text-white/50" : "text-text-muted"}>
        vs periode sebelumnya
      </span>
    </>
  );
};

/**
 * Strip 7 hari terakhir bergaya Timeline Stitch.
 * Interaktif: hari bisa diketuk untuk melihat detail jam–pendapatan–
 * keluhan; bolt = catat cepat (gandakan log terakhir ke hari ini).
 */
const TimelineCard = ({ dataHari, padaRefresh }) => {
  const strip = useMemo(() => {
    const hariIni = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const tanggal = new Date(hariIni);
      tanggal.setDate(hariIni.getDate() - (6 - i));
      const kunci = kunciTanggal(tanggal);
      return {
        tanggal,
        kunci,
        inisial: new Intl.DateTimeFormat("id-ID", { weekday: "narrow" }).format(
          tanggal
        ),
        isToday: i === 6,
        adaLog: (dataHari || []).some((h) => h.tanggal === kunci),
      };
    });
  }, [dataHari]);

  // Hari terpilih (default: hari ini), mode tampilan, dan status catat cepat.
  const [kunciTerpilih, setKunciTerpilih] = useState(null);
  const [sedangCatat, setSedangCatat] = useState(false);
  const [catatPesan, setCatatPesan] = useState(null);

  const kunciHariIni = strip[6]?.kunci;
  const kunciAktif = kunciTerpilih ?? kunciHariIni;
  const hariAktif = strip.find((h) => h.kunci === kunciAktif) || strip[6];
  const dataAktif = (dataHari || []).find((h) => h.tanggal === kunciAktif);

  const labelLengkap = (tanggal) =>
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(tanggal);

  // Catat cepat: gandakan log terakhir ke hari ini, lalu muat ulang data.
  const catatCepat = async () => {
    if (sedangCatat) return;
    setSedangCatat(true);
    setCatatPesan(null);
    try {
      const respons = await api.post("/api/logs/quick-log");
      if (respons.data?.success) {
        setCatatPesan({
          tipe: "sukses",
          teks: "Log terakhir berhasil digandakan ke hari ini.",
        });
        if (padaRefresh) padaRefresh();
      } else {
        setCatatPesan({
          tipe: "error",
          teks: respons.data?.error || "Gagal mencatat cepat, coba lagi.",
        });
      }
    } catch (err) {
      setCatatPesan({
        tipe: "error",
        teks: "Gagal mencatat cepat — periksa koneksi Anda.",
      });
    } finally {
      setSedangCatat(false);
    }
  };

  const kelasLingkar = (hari) =>
    hari.isToday
      ? "bg-primary font-bold text-white shadow-xs"
      : hari.adaLog
      ? "bg-surface-subtle font-semibold text-primary"
      : "font-medium text-text-muted";

  return (
    <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
          Timeline
        </h2>
        <div className="flex items-center gap-1 text-text-muted">
          <button
            type="button"
            onClick={catatCepat}
            disabled={sedangCatat}
            title="Catat cepat: gandakan log terakhir ke hari ini"
            aria-label="Catat cepat dari log terakhir"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-subtle hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sedangCatat ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-[19px]">bolt</span>
            )}
          </button>
        </div>
      </div>

      {catatPesan && (
        <div
          role="status"
          className={`mb-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold ${
            catatPesan.tipe === "sukses"
              ? "bg-primary/10 text-primary-dark"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {catatPesan.tipe === "sukses" ? "check_circle" : "error"}
          </span>
          <span className="flex-1">{catatPesan.teks}</span>
          <button
            type="button"
            onClick={() => setCatatPesan(null)}
            aria-label="Tutup pemberitahuan"
            className="rounded-full p-0.5 transition-colors hover:bg-black/5"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Strip 7 hari — ketuk hari untuk detail jam · pendapatan · keluhan */}
        <div className="grid grid-cols-7 items-start text-center">
          {strip.map((hari) => {
            const aktif = hari.kunci === kunciAktif;
            return (
              <button
                type="button"
                key={hari.kunci}
                onClick={() => setKunciTerpilih(hari.kunci)}
                aria-pressed={aktif}
                aria-label={`Detail ${labelLengkap(hari.tanggal)}${
                  hari.adaLog ? "" : ", belum ada catatan"
                }`}
                title={`${labelLengkap(hari.tanggal)}${
                  hari.adaLog ? "" : " — belum ada catatan"
                }`}
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
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs lg:h-9 lg:w-9 ${kelasLingkar(
                    hari
                  )} ${
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

      {/* Panel detail hari terpilih */}
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-subtle p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold capitalize text-text-primary">
            {hariAktif ? labelLengkap(hariAktif.tanggal) : "-"}
          </p>
          {dataAktif?.isPuncak && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-mint/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              Hari puncak
            </span>
          )}
        </div>
        {dataAktif && dataAktif.jamKerja > 0 ? (
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-card px-2 py-2.5">
              <p className="text-[15px] font-bold text-text-primary">
                {dataAktif.jamKerja}
                <span className="ml-0.5 text-[10px] font-medium text-text-muted">jam</span>
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-text-muted">Jam kerja</p>
            </div>
            <div className="rounded-xl bg-surface-card px-2 py-2.5">
              <p className="truncate text-[13px] font-bold text-text-primary">
                {formatRupiah(dataAktif.pendapatan)}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-text-muted">Pendapatan</p>
            </div>
            <div className="rounded-xl bg-surface-card px-2 py-2.5">
              <p className="text-[15px] font-bold text-text-primary">
                {dataAktif.keluhan}
                <span className="ml-0.5 text-[10px] font-medium text-text-muted">keluhan</span>
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-text-muted">Keluhan fisik</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[11px] font-medium text-text-muted">
            Belum ada catatan pada hari tersebut. Ketuk ikon petir untuk mencatat
            cepat dari log terakhir.
          </p>
        )}
      </div>
    </section>
  );
};

export const DashboardPage = () => {
  const [periode, setPeriode] = useState(7);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [riskScoreData, setRiskScoreData] = useState(null);
  const [weeklyInsightData, setWeeklyInsightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [delta, setDelta] = useState(null);
  const nama = bacaNama();

  const fetchData = async (days) => {
    try {
      setLoading(true);
      setGagalMuat(false);
      const [resSummary, resSummary2x, resCorr, resRisk, resInsight] =
        await Promise.allSettled([
          api.get(`/api/dashboard/summary?days=${days}`),
          // Dua kali panjang periode → periode sebelumnya = (2×) − (1×)
          api.get(`/api/dashboard/summary?days=${days * 2}`),
          api.get(`/api/dashboard/correlation?days=${days}`),
          api.get("/api/ai/risk-score"),
          api.get("/api/ai/weekly-insight"),
        ]);

      setSummary(
        resSummary.status === "fulfilled" && resSummary.value.data?.success
          ? resSummary.value.data.data
          : null
      );

      const prev =
        resSummary2x.status === "fulfilled" &&
        resSummary2x.value.data?.success &&
        resSummary.status === "fulfilled" &&
        resSummary.value.data?.success
          ? {
              jam:
                (resSummary2x.value.data.data?.totalWorkHours ?? 0) -
                (resSummary.value.data.data?.totalWorkHours ?? 0),
              penghasilan:
                (resSummary2x.value.data.data?.avgIncome ?? 0) -
                (resSummary.value.data.data?.avgIncome ?? 0),
            }
          : null;
      const cur =
        resSummary.status === "fulfilled" && resSummary.value.data?.success
          ? resSummary.value.data.data
          : null;
      setDelta(
        prev && cur
          ? {
              jam:
                prev.jam > 0
                  ? ((cur.totalWorkHours - prev.jam) / prev.jam) * 100
                  : null,
              penghasilan:
                prev.penghasilan > 0
                  ? ((cur.avgIncome - prev.penghasilan) / prev.penghasilan) * 100
                  : null,
            }
          : null
      );

      setChartData(
        resCorr.status === "fulfilled" && resCorr.value.data?.success
          ? resCorr.value.data.data
          : null
      );

      setRiskScoreData(
        resRisk.status === "fulfilled" && resRisk.value.data?.success
          ? resRisk.value.data.data
          : null
      );

      setWeeklyInsightData(
        resInsight.status === "fulfilled" && resInsight.value.data?.success
          ? resInsight.value.data.data
          : null
      );
    } catch (e) {
      console.warn("Gagal memuat data dashboard:", e);
      setGagalMuat(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(periode);
  }, [periode]);

  const hariChart = chartData?.hari || [];
  const activeRiskScore = riskScoreData?.skor ?? null;
  const activeRiskLevel = riskScoreData?.level ?? null;

  const hariPuncak = useMemo(() => {
    if (hariChart.length === 0) return null;
    const puncak = hariChart.reduce((a, b) => (b.jamKerja > a.jamKerja ? b : a));
    return puncak.jamKerja > 0 ? `${puncak.hari} (${puncak.jamKerja} jam)` : null;
  }, [hariChart]);

  const statistikBebasKeluhan = useMemo(() => {
    const hariAktif = hariChart.filter((h) => h.jamKerja > 0);
    if (hariAktif.length === 0) return { persen: null, jumlah: 0, total: 0 };
    const bebas = hariAktif.filter((h) => h.keluhan === 0).length;
    return {
      persen: Math.round((bebas / hariAktif.length) * 100),
      jumlah: bebas,
      total: hariAktif.length,
    };
  }, [hariChart]);

  const distribusi = (chartData?.distribusiKeluhan || []).slice(0, 3);

  const rentangTanggal = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    });
    const akhir = new Date();
    const awal = new Date();
    awal.setDate(awal.getDate() - (periode - 1));
    return `${fmt.format(awal)} – ${fmt.format(akhir)} ${akhir.getFullYear()}`;
  }, [periode]);

  const totalJam = summary?.totalWorkHours ?? 0;
  const rataHarian = totalJam / periode;
  const skorRisiko = activeRiskScore;

  /* Unduh Ringkasan: butuh minimal 1 log di periode terpilih.
     Tanpa itu CSV hanya berisi header (membingungkan).
     Tidak dipatok 7 log/hari agar pengguna baru tetap bisa ekspor data. */
  const bisaUnduh = (summary?.totalLogs ?? 0) > 0;

  const unduhRingkasan = () => {
    const baris = [];
    baris.push("Ringkasan VITARA Periode " + periode + " Hari");
    baris.push(`Rentang,${rentangTanggal}`);
    baris.push(`Total Jam Kerja,${totalJam}`);
    baris.push(`Rata-rata Penghasilan/Hari,${summary?.avgIncome ?? 0}`);
    baris.push(`Total Keluhan,${summary?.totalSymptoms ?? 0}`);
    baris.push(`Jumlah Hari Tercatat,${summary?.totalLogs ?? 0}`);
    baris.push(`Skor Risiko,${skorRisiko ?? "-"}`);
    baris.push(`Level Risiko,${activeRiskLevel ?? "-"}`);
    baris.push("");
    baris.push("Hari,Tanggal,Jam Kerja,Keluhan,Pendapatan");
    hariChart.forEach((h) =>
      baris.push([h.hari, h.tanggal, h.jamKerja, h.keluhan, h.pendapatan].join(","))
    );
    const blob = new Blob(["\ufeff" + baris.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vitara-ringkasan-${periode}hari.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Hero sapaan di atas gradien pine */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-6 pt-6 text-white lg:px-12 lg:pt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {rentangTanggal} · {periode} hari
            </span>
            <h1 className="mt-2 text-[27px] font-bold leading-[1.25] tracking-tight lg:text-[34px]">
              {sapaanHari()}, {nama}
            </h1>
            <p className="mt-1.5 text-sm text-white/70 font-body">
              Pantau ritme kerja dan kebugaran fisik harianmu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented control periode */}
            <div className="glass-pill inline-flex items-center rounded-full p-1">
              {[7, 30].map((nilai) => (
                <button
                  key={nilai}
                  type="button"
                  onClick={() => setPeriode(nilai)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    periode === nilai
                      ? "bg-white text-primary shadow-xs"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {nilai} Hari
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={unduhRingkasan}
              disabled={loading || !bisaUnduh}
              title={
                bisaUnduh
                  ? "Unduh ringkasan CSV periode ini"
                  : "Catat minimal 1 hari dulu untuk mengunduh ringkasan"
              }
              aria-label={
                bisaUnduh
                  ? "Unduh ringkasan CSV periode ini"
                  : "Unduh dinonaktifkan: belum ada catatan pada periode ini"
              }
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span className="hidden sm:inline">Unduh Ringkasan</span>
              <span className="sm:hidden">Unduh</span>
            </button>
            {!loading && !bisaUnduh && (
              <span className="w-full text-[11px] font-medium text-white/60">
                Catat minimal 1 hari dulu untuk mengunduh ringkasan.
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 pb-14 lg:px-12">
        {gagalMuat && !loading && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
            <span className="material-symbols-outlined text-[18px] text-amber-700">
              error
            </span>
            Beberapa data gagal dimuat dari server. Coba muat ulang halaman.
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-7">
          {/* KIRI: timeline, kartu ringkasan gelap, dua metrik */}
          <div className="flex flex-col gap-5 lg:col-span-5 lg:gap-6">
            <TimelineCard dataHari={hariChart} padaRefresh={() => fetchData(periode)} />

            {/* Hero ringkasan hari ini */}
            <section className="relative overflow-hidden rounded-4xl bg-primary p-5 text-white shadow-hero lg:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-mint/15 blur-3xl"
              />
              <div className="relative flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-[12px] font-medium text-white/90">
                  Ringkasan Periode
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/70">
                  <span className="material-symbols-outlined text-[15px]">
                    schedule
                  </span>
                  {periode} hari terakhir
                </span>
              </div>

              <div className="relative mt-5 flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <span className="material-symbols-outlined text-[22px] text-accent-mint">
                    two_wheeler
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-bold tracking-tight">
                    {loading ? "Memuat…" : `${totalJam.toFixed(1)} Jam Operasi`}
                  </h2>
                  <p className="mt-0.5 truncate text-[12px] text-white/70">
                    {summary?.totalLogs ?? 0} hari tercatat • Rata-rata{" "}
                    {rataHarian.toFixed(1)} jam/hari
                  </p>
                </div>
              </div>

              <Link
                to="/logger"
                className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[17px] text-accent-mint">
                  check_circle
                </span>
                Lihat Evaluasi Lengkap
              </Link>
            </section>

            {/* Dua metrik ringkas */}
            <div className="grid grid-cols-2 gap-3.5 lg:gap-4">
              <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-card p-4 shadow-card lg:p-5">
                <span className="text-[11px] font-medium text-text-muted">
                  Total Jam Kerja
                </span>
                <div className="mt-2.5">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {loading ? "…" : totalJam.toFixed(1)}{" "}
                    <span className="text-xs font-normal text-text-muted">Jam</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    Rata-rata {rataHarian.toFixed(1)}j / hari
                  </p>
                </div>
                <div className="mt-2 text-[11px]">
                  {loading ? (
                    <span className="text-text-muted">Memuat…</span>
                  ) : (
                    <LabelDelta persen={delta?.jam ?? null} />
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-card p-4 shadow-card lg:p-5">
                <span className="text-[11px] font-medium text-text-muted">
                  Skor Risiko
                </span>
                <div className="mt-2.5">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {loading ? "…" : skorRisiko === null ? "—" : skorRisiko}
                    <span className="text-xs font-normal text-text-muted">
                      {skorRisiko === null ? "" : "/100"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {activeRiskLevel || "Belum ada data log"}
                  </p>
                </div>
                {/* Skala segmen 10 tick — bukan bar linear generik */}
                <div
                  className="mt-2 flex items-center gap-1"
                  role="img"
                  aria-label={`Skor risiko ${skorRisiko ?? "-"} dari 100`}
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const aktif =
                      skorRisiko !== null && i < Math.round(skorRisiko / 10);
                    return (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          aktif
                            ? skorRisiko >= 70
                              ? "bg-status-alert"
                              : skorRisiko >= 40
                              ? "bg-amber-500"
                              : "bg-accent-mint"
                            : "bg-surface-variant"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Evaluasi kondisi — mengalir di kolom kiri */}
            <EvaluationCard
              riskScoreData={riskScoreData}
              loading={loading}
              hariBebasKeluhan={statistikBebasKeluhan.jumlah}
              totalHariAktif={statistikBebasKeluhan.total}
            />
          </div>

          {/* KANAN: grafik */}
          <div className="lg:col-span-7">
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-text-primary lg:text-lg">
                    Aktivitas vs Keluhan
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Korelasi durasi kerja dengan intensitas kelelahan fisik
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                    Jam Kerja
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-accent-terracotta" />
                    Keluhan
                  </span>
                </div>
              </div>

              <CorrelationChart data={hariChart} loading={loading} />

              <div className="mt-4 rounded-2xl bg-surface-subtle p-4 text-[12px] leading-relaxed text-text-muted">
                {hariPuncak && hariChart.some((h) => h.jamKerja > 8) ? (
                  <span className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[17px] text-amber-500">
                      warning
                    </span>
                    <span>
                      <strong className="font-semibold text-text-primary">
                        Puncak beban {hariPuncak}:
                      </strong>{" "}
                      ada hari yang melewati batas aman 8 jam. Prioritaskan jeda
                      istirahat berkala.
                    </span>
                  </span>
                ) : (
                  <span className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[17px] text-accent-mint">
                      check_circle
                    </span>
                    <span>
                      <strong className="font-semibold text-text-primary">
                        Dalam batas aman:
                      </strong>{" "}
                      {hariChart.length > 0
                        ? "tidak ada hari dengan jam kerja melewati batas 8 jam pada periode ini."
                        : "belum ada catatan pada periode ini. Mulai catat harian Anda di menu Catat."}
                    </span>
                  </span>
                )}
              </div>
            </section>

            {/* Wawasan ergonomi tubuh — tepat di bawah grafik, tanpa jeda kosong */}
            <section className="mt-5 flex h-full flex-col rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:mt-6 lg:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                    Wawasan Ergonomi Tubuh
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Distribusi beban fisik dari postur berkendara
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-primary">
                  <span className="material-symbols-outlined text-[19px]">
                    accessibility_new
                  </span>
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {distribusi.length === 0 ? (
                  <p className="text-xs text-text-muted">
                    Belum ada keluhan tercatat pada periode ini.
                  </p>
                ) : (
                  distribusi.map((item, idx) => (
                    <div key={item.area} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-primary">
                          {item.area}
                        </span>
                        <span className="font-bold text-text-primary">
                          {item.persen}%
                        </span>
                      </div>
                      {/* Deretan manik 10 titik — intensitas bukan bar linear */}
                      <div
                        className="flex items-center gap-1.5"
                        role="img"
                        aria-label={`${item.area}: ${item.persen} persen`}
                      >
                        {Array.from({ length: 10 }).map((_, dot) => (
                          <span
                            key={dot}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              dot < Math.round(item.persen / 10)
                                ? idx === 0
                                  ? "bg-primary"
                                  : idx === 1
                                  ? "bg-primary/60"
                                  : "bg-accent-mint"
                                : "bg-surface-variant"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-text-muted">
                        {item.jumlah} keluhan tercatat
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-auto pt-5">
                <div className="rounded-2xl bg-surface-subtle p-4">
                  <span className="text-xs font-semibold text-text-primary">
                    Rekomendasi micro-break
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    Lakukan jeda peregangan 3–5 menit setiap 3 trip selesai.
                    Prioritaskan relaksasi panggul dan peregangan leher untuk
                    mencegah nyeri muskuloskeletal kronis.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Link
                    to="/reminder"
                    className="whitespace-nowrap rounded-full bg-primary py-2.5 px-3 text-center text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    Peregangan 5 Menit
                  </Link>
                  <Link
                    to="/chat"
                    className="whitespace-nowrap rounded-full border border-border-subtle bg-surface-card py-2.5 px-3 text-center text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
                  >
                    Tanya Ergo-Coach
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Ringkasan ergo-insight selebar konten */}
        <div className="mt-5 lg:mt-6">
          <ErgoInsightCard
            weeklyInsightData={weeklyInsightData}
            loading={loading}
          />
        </div>

        <p className="mt-5 px-1 text-[11px] text-text-muted">
          Rata-rata pendapatan periode ini:{" "}
          <span className="font-semibold text-text-primary">
            {formatRupiah(summary?.avgIncome ?? 0)}
          </span>{" "}
          • {summary?.totalSymptoms ?? 0} keluhan dari {summary?.totalLogs ?? 0}{" "}
          hari tercatat.
        </p>
      </main>
    </div>
  );
};

export default DashboardPage;

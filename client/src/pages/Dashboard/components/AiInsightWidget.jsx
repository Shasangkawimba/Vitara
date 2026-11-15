// ============================================================
// client/src/pages/Dashboard/components/AiInsightWidget.jsx
// Dua kartu evaluasi Ergo-Coach untuk Dashboard:
//   • EvaluationCard → skor risiko + saran singkat, ditempatkan
//     sejajar dengan kartu Wawasan Ergonomi Tubuh.
//   • ErgoInsightCard → ringkasan ergo-insight selebar konten.
// Sumber: GET /api/ai/risk-score & GET /api/ai/weekly-insight.
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

/** Terjemahkan skor risiko menjadi label, warna, dan saran singkat. */
const hitungLevelRisiko = (skor, levelApi, saran) => {
  if (skor === null || skor === undefined) {
    return {
      label: "Belum ada data",
      textColor: "text-text-muted",
      warnaBusur: "stroke-surface-variant",
      pesan:
        "Catat jam kerja hari ini di Catatan Harian untuk memantau risiko kelelahan Anda.",
    };
  }
  if (skor >= 70 || levelApi === "Risiko Tinggi") {
    return {
      label: "Risiko tinggi",
      textColor: "text-status-alert",
      warnaBusur: "stroke-status-alert",
      pesan:
        saran ||
        "Beban kerja ekstrem. Sangat disarankan kurangi durasi berkendara hari ini.",
    };
  }
  if (skor >= 40 || levelApi === "Risiko Sedang") {
    return {
      label: "Risiko sedang",
      textColor: "text-amber-700",
      warnaBusur: "stroke-amber-500",
      pesan:
        saran ||
        "Mulai timbul kelelahan otot. Lakukan peregangan berkala setiap 2 jam berkendara.",
    };
  }
  return {
    label: "Risiko rendah",
    textColor: "text-primary",
    warnaBusur: "stroke-accent-mint",
    pesan:
      saran || "Kondisi fisik stabil. Pertahankan pola istirahat dan hidrasi cairan.",
  };
};

/**
 * Kartu evaluasi kondisi: skor risiko, level, dan satu saran singkat.
 * Mengalir di kolom kiri Dashboard, tepat di bawah deret metrik.
 */
export const EvaluationCard = ({
  riskScoreData,
  loading,
  hariBebasKeluhan = 0,
  totalHariAktif = 0,
}) => {
  const skor = riskScoreData?.skor ?? null;
  const level = hitungLevelRisiko(
    skor,
    riskScoreData?.level ?? null,
    riskScoreData?.saran ?? null
  );

  return (
    <section className="flex h-full flex-col rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
            Evaluasi Kondisi
          </h2>
          <p className="mt-0.5 text-xs text-text-muted font-body">
            Rekomendasi dari Ergo-Coach
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary">
          <span className="material-symbols-outlined text-[19px]">
            monitor_heart
          </span>
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline gap-1.5">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-subtle" />
          ) : (
            <>
              <span className="text-[38px] font-bold leading-none tracking-tight text-text-primary">
                {skor !== null ? skor : "—"}
              </span>
              <span className="text-xs font-semibold text-text-muted">
                {skor !== null ? "/ 100" : "belum dinilai"}
              </span>
            </>
          )}
        </div>

        <p className={`mt-2 text-xs font-semibold ${level.textColor}`}>
          {level.label}
        </p>

        {/* Gauge busur setengah lingkaran — skor digambar sebagai busur warna */}
        <div className="mt-4 flex justify-center">
          <svg
            viewBox="0 0 100 52"
            className="w-44 max-w-full"
            role="img"
            aria-label={`Skor risiko ${skor !== null ? skor : "-"} dari 100`}
          >
            <path
              d="M10 46 A40 40 0 0 1 90 46"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              className="text-border-subtle"
            />
            <path
              d="M10 46 A40 40 0 0 1 90 46"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${
                skor !== null ? (Math.min(Math.max(skor, 0), 100) / 100) * 126 : 0
              } 999`}
              className={`${level.warnaBusur} transition-all duration-500`}
            />
          </svg>
        </div>

        <p className="mt-3.5 text-[13px] leading-relaxed text-text-muted">
          {level.pesan}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
        <span className="text-[11px] text-text-muted">
          {totalHariAktif > 0
            ? `${hariBebasKeluhan} dari ${totalHariAktif} hari bebas keluhan`
            : "Belum ada hari tercatat"}
        </span>
        <Link
          to="/chat"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Tanya Ergo-Coach
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
        </Link>
      </div>
    </section>
  );
};

/** Pisahkan narasi menjadi kalimat utuh (titik desimal tidak ikut terpotong). */
const pecahKalimat = (teks) =>
  String(teks)
    .split(/(?<=\.)\s+/)
    .map((kalimat) => kalimat.trim())
    .filter(Boolean);

/** Bagi kalimat ke dua kolom seimbang tanpa memotong kalimat. */
const bagiDuaKolom = (kalimat) => {
  if (kalimat.length < 2) return [kalimat.join(" "), ""];
  const totalPanjang = kalimat.reduce((total, k) => total + k.length, 0);
  let batas = 1;
  let akumulasi = 0;
  for (let i = 0; i < kalimat.length - 1; i += 1) {
    akumulasi += kalimat[i].length;
    batas = i + 1;
    if (akumulasi >= totalPanjang / 2) break;
  }
  return [
    kalimat.slice(0, batas).join(" "),
    kalimat.slice(batas).join(" "),
  ];
};

/** Kartu ringkasan evaluasi 14 hari, dibentangkan selebar konten. */
export const ErgoInsightCard = ({ weeklyInsightData, loading }) => {
  const ringkasan =
    weeklyInsightData?.ringkasan ||
    weeklyInsightData?.data?.ringkasan ||
    "Evaluasi beban kerja dan keluhan muskuloskeletal mingguan Anda sedang disinkronkan dari riwayat kerja.";

  const [kolomKiri, kolomKanan] = bagiDuaKolom(pecahKalimat(ringkasan));

  return (
    <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-7">
      {/* Kepala kartu */}
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">
              psychology
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight text-text-primary lg:text-base">
              Ringkasan ergo-insight
            </h2>
            <p className="mt-0.5 text-[11px] text-text-muted font-body">
              Evaluasi beban kerja &amp; keluhan dari Ergo-Coach
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 pt-1 text-[11px] font-medium text-text-muted sm:block">
          14 hari terakhir
        </span>
      </div>

      {/* Isi narasi: kalimat utuh, dibagi dua kolom seimbang */}
      {loading ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-8">
          {[0, 1].map((kolom) => (
            <div key={kolom} className="space-y-2.5">
              <div className="h-3.5 w-full animate-pulse rounded-md bg-surface-subtle" />
              <div className="h-3.5 w-11/12 animate-pulse rounded-md bg-surface-subtle" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-md bg-surface-subtle" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-8">
          <p className="text-[13px] leading-7 text-text-muted">{kolomKiri}</p>
          {kolomKanan && (
            <p className="border-t border-border-subtle pt-4 text-[13px] leading-7 text-text-muted lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {kolomKanan}
            </p>
          )}
        </div>
      )}

      {/* Kaki kartu */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
        <span className="text-[11px] text-text-muted">
          Sumber: analisis Ergo-Coach
        </span>
        <Link
          to="/chat"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Konsultasi keluhan lengkap
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
        </Link>
      </div>
    </section>
  );
};

export default EvaluationCard;

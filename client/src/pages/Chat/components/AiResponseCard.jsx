// ============================================================
// client/src/pages/Chat/components/AiResponseCard.jsx
// Kartu jawaban Ergo-Coach AI.
// Struktur mengikuti desain Stitch "Ergo-Coach AI (Structured Chat)":
//   - Analisis Singkat
//   - Rencana Pemulihan Cepat (checklist)
//   - Rekomendasi Obat Bebas (OTC)
//   - Peringatan Darurat (merah + 119)
//   - Disclaimer (italic)
// ============================================================
import React from "react";

/**
 * Sorot nomor darurat 119 agar mudah terlihat pada teks peringatan.
 */
const renderPeringatan = (teks) => {
  const bagian = String(teks).split(/(119)/g);
  return bagian.map((potongan, index) =>
    potongan === "119" ? (
      <span
        key={index}
        className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-red-600 text-white font-bold"
      >
        119
      </span>
    ) : (
      <React.Fragment key={index}>{potongan}</React.Fragment>
    )
  );
};

/**
 * Judul kecil untuk tiap seksi di dalam kartu AI.
 */
const JudulSeksi = ({ ikon, children, warna = "text-primary" }) => (
  <div className={`flex items-center gap-2 mb-2 ${warna}`}>
    <span className="material-symbols-outlined text-[18px]">{ikon}</span>
    <h3 className="font-display text-sm font-bold tracking-wide uppercase">
      {children}
    </h3>
  </div>
);

const AiResponseCard = ({ data, waktu }) => {
  const {
    analisis,
    rencana_pemulihan: rencana = [],
    saran_otc: saranOtc = [],
    peringatan,
    disclaimer,
    isEmergency = false,
    modeLabel,
    logCount,
  } = data || {};

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
        isEmergency ? "border-red-300" : "border-border-subtle"
      }`}
    >
      {/* Header kartu: identitas AI + waktu + mode analisis */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${
          isEmergency
            ? "bg-red-50 border-red-200"
            : "bg-surface-muted border-border-subtle"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isEmergency ? "bg-red-600" : "bg-primary"
          }`}
        >
          <span className="material-symbols-outlined text-white text-[18px]">
            {isEmergency ? "warning" : "smart_toy"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-text-main truncate">
              Ergo-Coach AI
            </p>
            <span className="material-symbols-outlined text-primary text-[14px]">
              verified
            </span>
          </div>
          <p className="text-[11px] text-text-soft truncate">
            {isEmergency ? "Mode Darurat" : `Mode ${modeLabel || "Analisis"}`}
            {typeof logCount === "number" && !isEmergency
              ? ` • ${logCount} log dianalisis`
              : ""}
            {waktu ? ` • ${waktu}` : ""}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* 1. Analisis Singkat */}
        {analisis && (
          <section>
            <JudulSeksi ikon="stethoscope">Analisis Singkat</JudulSeksi>
            <p className="text-sm leading-relaxed text-text-muted">{analisis}</p>
          </section>
        )}

        {/* 2. Rencana Pemulihan Cepat */}
        {rencana.length > 0 && (
          <section>
            <JudulSeksi ikon="fitness_center">
              Rencana Pemulihan Cepat
            </JudulSeksi>
            <ul className="space-y-2.5">
              {rencana.map((langkah, index) => (
                <li key={index} className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div className="min-w-0">
                    {langkah.judul && (
                      <p className="text-sm font-semibold text-text-main">
                        {langkah.judul}
                      </p>
                    )}
                    {langkah.detail && (
                      <p className="text-[13px] leading-relaxed text-text-muted">
                        {langkah.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 3. Rekomendasi Obat Bebas (OTC) */}
        {saranOtc.length > 0 && (
          <section>
            <JudulSeksi ikon="medication">
              Rekomendasi Obat Bebas (OTC)
            </JudulSeksi>
            <ul className="space-y-2.5">
              {saranOtc.map((obat, index) => (
                <li key={index} className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                    pill
                  </span>
                  <div className="min-w-0">
                    {obat.nama && (
                      <p className="text-sm font-semibold text-text-main">
                        {obat.nama}
                      </p>
                    )}
                    {obat.detail && (
                      <p className="text-[13px] leading-relaxed text-text-muted">
                        {obat.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 4. Peringatan Darurat */}
        {peringatan && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
            <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0">
              warning
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                Peringatan Darurat
              </p>
              <p className="text-[13px] leading-relaxed text-red-800">
                {renderPeringatan(peringatan)}
              </p>
            </div>
          </section>
        )}

        {/* 5. Disclaimer wajib */}
        <section className="flex gap-2 border-t border-border-subtle pt-3">
          <span className="material-symbols-outlined text-text-soft text-[16px] shrink-0">
            info
          </span>
          <p className="text-[11px] italic leading-relaxed text-text-soft">
            {disclaimer ||
              "Ini bukan diagnosis medis. Konsultasikan ke dokter atau fasilitas kesehatan terdekat jika keluhan berlanjut."}
          </p>
        </section>
      </div>
    </div>
  );
};

export default AiResponseCard;

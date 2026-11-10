// ============================================================
// client/src/pages/Chat/index.jsx
// Halaman Ergo-Coach AI (Milik P2).
// Konsultasi keluhan kerja ke POST /api/ai/coach dan menampilkan
// jawaban terstruktur (analisis, rencana, OTC, peringatan).
// Desain mengikuti Stitch "Ergo-Coach AI (Structured Chat)".
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import AiResponseCard from "./components/AiResponseCard";
import MessageBubble from "./components/MessageBubble";
import Composer from "./components/Composer";
import EmergencyBanner from "./components/EmergencyBanner";
import deteksiDarurat from "./emergency";

// Chip saran cepat, diambil dari desain Stitch.
const SARAN_CEPAT = [
  { ikon: "front_hand", teks: "Boleh dipijat urut?" },
  { ikon: "calendar_today", teks: "Perlu rujukan Faskes 1?" },
  { ikon: "directions_bike", teks: "Tips setelan jok motor" },
];

/** Format waktu lokal "21:11 WIB". */
const formatWaktu = (date = new Date()) =>
  `${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })} WIB`;

/** Format tanggal panjang untuk pemisah sesi. */
const formatTanggalSesi = () =>
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Indikator AI sedang menganalisis. */
const IndikatorMengetik = () => (
  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border-subtle bg-white px-4 py-3 w-fit shadow-sm">
    <span className="material-symbols-outlined text-primary text-[18px] animate-pulse">
      smart_toy
    </span>
    <span className="text-xs text-text-muted">
      Ergo-Coach sedang menganalisis keluhan Anda…
    </span>
  </div>
);

const ChatPage = () => {
  const [pesan, setPesan] = useState("");
  const [daftarPesan, setDaftarPesan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Peringatan darurat aktif: { keywords: string[] } — dari server (final)
  // atau dipercepat client-side saat user mengetik red flag.
  const [peringatanDarurat, setPeringatanDarurat] = useState(null);

  const bawahRef = useRef(null);

  // Auto-scroll ke pesan terbaru.
  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [daftarPesan, loading]);

  /**
   * Kirim keluhan ke backend dan tambahkan jawaban AI ke daftar pesan.
   * @param {string} [teksManual] Dipakai oleh chip saran.
   */
  const kirimPesan = async (teksManual) => {
    const teks = (teksManual ?? pesan).trim();
    if (teks.length < 3 || loading) return;

    setError("");
    setPesan("");
    setDaftarPesan((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, tipe: "user", teks, waktu: formatWaktu() },
    ]);
    setLoading(true);

    // 1. Deteksi lokal: banner 119 tampil SECEPAT mungkin tanpa menunggu server.
    //    Keputusan final tetap dari server (isEmergency di respons /coach).
    const keywordLokal = deteksiDarurat(teks);
    if (keywordLokal.length > 0) {
      setPeringatanDarurat({ keywords: keywordLokal });
    }

    try {
      // Timeout per-request lebih panjang: Gemini bisa butuh >15 detik
      // (default instance api.js hanya 15 detik).
      const respons = await api.post(
        "/api/ai/coach",
        { pesan: teks },
        { timeout: 60000 }
      );
      const data = respons?.data?.data;

      if (!respons?.data?.success || !data) {
        throw new Error(
          respons?.data?.error || "Layanan AI tidak mengembalikan jawaban."
        );
      }

      setDaftarPesan((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          tipe: "ai",
          data,
          waktu: formatWaktu(),
        },
      ]);

      // 2. Verifikasi server: pastikan banner mengikuti verdict resmi AI.
      if (data.isEmergency) {
        setPeringatanDarurat({ keywords: data.matchedKeywords || [] });
      }
    } catch (err) {
      const pesanError =
        err?.response?.data?.error ||
        err?.message ||
        "Gagal menghubungi Ergo-Coach AI. Coba lagi beberapa saat.";
      setError(pesanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-page="chat" className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header sesi */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-[22px]">
                smart_toy
              </span>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-base font-bold text-text-main truncate">
                Ergo-Coach AI
              </h1>
              <span className="material-symbols-outlined text-primary text-[16px]">
                verified
              </span>
            </div>
            <p className="text-[11px] text-text-soft truncate">
              Asisten Pemulihan &amp; Ergonomi Mitra • Aktif 24 Jam
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-surface-muted text-primary border border-border-subtle uppercase">
            AI
          </span>
        </div>
      </div>

      {/* Area percakapan */}
      <div className="flex-1 space-y-4 py-4">
        {/* Pemisah sesi */}
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-border-subtle" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-soft">
            {formatTanggalSesi()} • Sesi Konsultasi
          </span>
          <span className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Sambutan bila belum ada pesan */}
        {daftarPesan.length === 0 && !loading && (
          <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[18px]">
                  stethoscope
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main mb-1">
                  Selamat datang, Mitra!
                </p>
                <p className="text-[13px] leading-relaxed text-text-muted">
                  Ceritakan keluhan fisik Anda setelah bekerja — misalnya nyeri
                  pinggang, leher kaku, atau pegal tangan. Saya akan menganalisis
                  berdasarkan catatan kerja 7 hari terakhir Anda.
                </p>
                <p className="mt-2 text-[11px] italic text-text-soft">
                  Ini bukan diagnosis medis. Konsultasikan ke dokter atau
                  fasilitas kesehatan terdekat jika keluhan berlanjut.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daftar pesan */}
        {daftarPesan.map((item) =>
          item.tipe === "user" ? (
            <MessageBubble key={item.id} teks={item.teks} waktu={item.waktu} />
          ) : (
            <div key={item.id} className="max-w-[95%] sm:max-w-[90%]">
              <AiResponseCard data={item.data} waktu={item.waktu} />
            </div>
          )
        )}

        {/* Indikator loading */}
        {loading && <IndikatorMengetik />}

        {/* Error non-fatal */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0">
              error
            </span>
            <p className="text-[13px] leading-relaxed text-red-700">{error}</p>
          </div>
        )}

        <div ref={bawahRef} />
      </div>

      {/* Chip saran cepat (hanya saat belum ada percakapan) */}
      {daftarPesan.length === 0 && !loading && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {SARAN_CEPAT.map((saran) => (
            <button
              key={saran.teks}
              type="button"
              onClick={() => kirimPesan(saran.teks)}
              className="flex items-center gap-1.5 shrink-0 rounded-full border border-border-subtle bg-white px-3 py-1.5 text-[12px] font-medium text-text-muted shadow-sm transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                {saran.ikon}
              </span>
              {saran.teks}
            </button>
          ))}
        </div>
      )}

      {/* Composer + banner darurat */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-surface/95 backdrop-blur-md border-t border-border-subtle">
        {peringatanDarurat && (
          <div className="mb-3">
            <EmergencyBanner
              keywords={peringatanDarurat.keywords}
              onDismiss={() => setPeringatanDarurat(null)}
            />
          </div>
        )}
        <Composer
          nilai={pesan}
          onChange={setPesan}
          onSend={() => kirimPesan()}
          loading={loading}
        />
        <p className="mt-1.5 text-center text-[10px] text-text-soft">
          Ergo-Coach AI • Bukan pengganti diagnosis dokter
        </p>
      </div>
    </div>
  );
};

export default ChatPage;

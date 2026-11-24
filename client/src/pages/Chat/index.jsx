// ============================================================
// client/src/pages/Chat/index.jsx
// Ergo-Coach AI (Milik P2) — tata letak mengikuti layar Stitch
// "Ergo-Coach AI": dua kolom di desktop (percakapan + panel
// protokol pemulihan), satu kolom di mobile.
// Logika dipertahankan: POST /api/ai/coach, deteksi darurat
// (lokal + verdict server), banner 119, dan input suara.
// Saat dibuka, riwayat konsultasi diambil dari GET /api/ai/history
// (AiInteraction milik user) sehingga percakapan tidak hilang saat reload.
// Tidak ada telemetri rekaan — panel kanan berisi panduan
// pemulihan umum dan akses bantuan nyata.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AiResponseCard from "./components/AiResponseCard";
import MessageBubble from "./components/MessageBubble";
import Composer from "./components/Composer";
import EmergencyBanner from "./components/EmergencyBanner";
import deteksiDarurat from "./emergency";

// Topik cepat — langsung dikirim sebagai pertanyaan ke Ergo-Coach.
const SARAN_CEPAT = [
  { ikon: "airline_seat_recline_extra", teks: "Nyeri pinggang setelah 4 jam menyetir" },
  { ikon: "accessibility_new", teks: "Leher dan bahu kaku setelah shift" },
  { ikon: "pan_tool", teks: "Pegal pergelangan tangan saat memegang gas" },
  { ikon: "directions_bike", teks: "Tips posisi jok motor agar tidak pegal" },
  { ikon: "water_drop", teks: "Cara rehidrasi saat shift di cuaca panas" },
];

// Protokol pemulihan mandiri (panduan umum, bukan hasil sensor).
const PROTOKOL = [
  {
    id: "lumbal",
    ikon: "self_improvement",
    judul: "Peregangan Lumbal & Bahu",
    detail: "10 menit saat jeda istirahat",
  },
  {
    id: "kompres",
    ikon: "hot_tub",
    judul: "Kompres Hangat Pinggang",
    detail: "15 menit di area pinggang bawah",
  },
  {
    id: "hidrasi",
    ikon: "local_drink",
    judul: "Rehidrasi 500 ml Air",
    detail: "Setelah shift selesai",
  },
];

/** Format waktu lokal "21:11 WIB". */
const formatWaktu = (date = new Date()) =>
  `${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })} WIB`;

/** Indikator AI sedang menganalisis. */
const IndikatorMengetik = () => (
  <div className="flex w-fit items-center gap-2 rounded-full border border-border-subtle bg-surface-subtle px-4 py-2.5">
    <span className="material-symbols-outlined animate-pulse text-[18px] text-primary">
      psychology
    </span>
    <span className="text-xs text-text-muted">Ergo-Coach sedang menganalisis…</span>
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
  // Checklist protokol (murni interaksi lokal, tidak dikirim ke server).
  const [protokolSelesai, setProtokolSelesai] = useState({});

  const areaRef = useRef(null);

  // Muat riwayat konsultasi dari server saat halaman dibuka.
  // Gagal/non-401 → diam-diam tampilkan empty state (mis. sesi baru).
  useEffect(() => {
    let aktif = true;
    const muatRiwayat = async () => {
      try {
        const respons = await api.get("/api/ai/history");
        const rows = respons?.data?.data;
        if (!respons?.data?.success || !Array.isArray(rows)) return;

        const pesanHistory = [];
        for (const baris of rows) {
          const waktu = formatWaktu(new Date(baris.createdAt));
          pesanHistory.push({
            id: `hist-user-${baris.id}`,
            tipe: "user",
            teks: baris.pesanUser,
            waktu,
          });
          if (baris.responsAi) {
            pesanHistory.push({
              id: `hist-ai-${baris.id}`,
              tipe: "ai",
              data: baris.responsAi,
              waktu,
            });
          }
        }
        if (aktif) {
          // Prepend agar pesan yang mungkin sudah terkirim duluan tetap tampil.
          setDaftarPesan((prev) => [...pesanHistory, ...prev]);
        }
      } catch (err) {
        console.warn(
          "[Chat] Gagal memuat riwayat:",
          err?.response?.data?.error || err?.message || err
        );
      }
    };
    muatRiwayat();
    return () => {
      aktif = false;
    };
  }, []);

  // Auto-scroll ke pesan terbaru di dalam area percakapan (scroll internal).
  useEffect(() => {
    const el = areaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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

  const toggleProtokol = (id) =>
    setProtokolSelesai((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div data-page="chat" className="w-full">
      {/* Kepala halaman */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-4 pt-6 text-white lg:px-12 lg:pt-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Asisten pemulihan fisik
            </span>
            <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-white lg:text-[32px]">
              Ergo-Coach AI
            </h1>
            <p className="mt-1 max-w-lg text-sm text-white/70 font-body">
              Ceritakan keluhan setelah bekerja. Analisis disusun dari catatan
              ritme kerja Anda dan panduan ergonomi.
            </p>
          </div>

          <Link
            to="/finder"
            className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
          >
            <span className="material-symbols-outlined text-[18px]">local_hospital</span>
            Faskes terdekat
          </Link>
        </div>

        {/* Topik cepat */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {SARAN_CEPAT.map((saran) => (
            <button
              key={saran.teks}
              type="button"
              onClick={() => kirimPesan(saran.teks)}
              disabled={loading}
              className="glass-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">{saran.ikon}</span>
              {saran.teks}
            </button>
          ))}
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 pb-14 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          {/* KIRI: kartu percakapan */}
          <section className="flex h-[calc(100dvh-16rem)] min-h-[700px] flex-col overflow-hidden rounded-4xl border border-border-subtle bg-surface-card shadow-card lg:col-span-7 lg:h-[calc(100dvh-16rem)] lg:min-h-[560px]">
            {/* Identitas asisten */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[21px]">psychology</span>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold tracking-tight text-text-primary">
                  Ergo-Coach
                </h2>
                <p className="truncate text-xs text-text-muted">
                  Pendamping pemulihan • analisis riwayat kerja
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1.5 text-[11px] font-medium text-text-muted sm:inline-flex">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Privat
              </span>
            </div>

            {/* Area percakapan — scroll internal */}
            <div
              ref={areaRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4"
            >
              {/* Sambutan bila belum ada pesan */}
              {daftarPesan.length === 0 && !loading && (
                <div className="flex flex-col items-center px-2 py-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[30px]">
                      favorite
                    </span>
                  </span>
                  <h3 className="mt-4 max-w-sm text-[17px] font-bold leading-snug tracking-tight text-text-primary">
                    Halo, saya pendamping pemulihan Anda.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
                    Ceritakan keluhan fisik setelah bekerja — nyeri pinggang,
                    leher kaku, atau pegal tangan. Saya akan menyusun analisis
                    dan rencana pemulihan singkat.
                  </p>
                  <p className="mt-3 max-w-sm text-xs italic leading-relaxed text-text-muted">                    Bukan diagnosis medis. Temui dokter atau faskes terdekat bila
                    keluhan berlanjut.
                  </p>
                </div>
              )}

              {/* Pemisah sesi — hanya menampilkan bila ada pesan (termasuk riwayat) */}
              {daftarPesan.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border-subtle" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Riwayat Percakapan
                  </span>
                  <span className="h-px flex-1 bg-border-subtle" />
                </div>
              )}

              {/* Daftar pesan */}
              {daftarPesan.map((item) =>
                item.tipe === "user" ? (
                  <MessageBubble key={item.id} teks={item.teks} waktu={item.waktu} />
                ) : (
                  <AiResponseCard key={item.id} data={item.data} waktu={item.waktu} />
                )
              )}

              {loading && <IndikatorMengetik />}

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <span className="material-symbols-outlined shrink-0 text-[18px] text-red-600">
                    error
                  </span>
                  <p className="text-[13px] leading-relaxed text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Banner darurat + composer */}
            <div className="shrink-0 border-t border-border-subtle px-4 pb-3 pt-3">
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

              <p className="mt-2 text-center text-[11px] text-text-muted">
                Bukan pengganti diagnosis dokter • Data Anda tidak dibagikan
              </p>
            </div>
          </section>

          {/* KANAN: protokol pemulihan & bantuan */}
          <aside className="flex flex-col gap-5 lg:col-span-5">
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-text-primary">
                    Protokol Pemulihan Mandiri
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Rutinitas ringan pasca-shift
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-subtle px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Harian
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                {PROTOKOL.map((item) => {
                  const selesai = !!protokolSelesai[item.id];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-subtle p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-card text-primary">
                          <span className="material-symbols-outlined text-[19px]">
                            {item.ikon}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`truncate text-[13px] font-semibold ${
                              selesai
                                ? "text-text-muted line-through"
                                : "text-text-primary"
                            }`}
                          >
                            {item.judul}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProtokol(item.id)}
                        aria-pressed={selesai}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          selesai
                            ? "bg-primary text-white"
                            : "border border-border-subtle bg-surface-card text-text-primary hover:border-primary hover:text-primary"
                        }`}
                      >
                        {selesai ? "Selesai" : "Tandai"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-text-muted">
                Hentikan peregangan bila nyeri bertambah. Konsultasikan ke
                fisioterapis bila keluhan menetap lebih dari seminggu.
              </p>
            </section>

            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-text-primary">
                    Butuh bantuan segera?
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted font-body">
                    Keluhan berat butuh penanganan medis langsung
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <span className="material-symbols-outlined text-[19px]">emergency</span>
                </span>
              </div>

              <a
                href="tel:119"
                className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3.5 text-white transition-colors hover:bg-primary-dark"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  <span>
                    <span className="block text-sm font-bold leading-tight">
                      Hubungi 119
                    </span>
                    <span className="block text-[11px] text-white/70">
                      Panggilan darurat gratis, 24 jam
                    </span>
                  </span>
                </span>
                <span className="material-symbols-outlined text-[18px] text-white/70">
                  arrow_forward
                </span>
              </a>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <Link
                  to="/finder"
                  className="flex items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-surface-card py-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    local_hospital
                  </span>
                  Faskes
                </Link>
                <Link
                  to="/reminder"
                  className="flex items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-surface-card py-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[17px]">alarm</span>
                  Pengingat
                </Link>
              </div>

              <p className="mt-4 border-t border-border-subtle pt-3 text-[11px] leading-relaxed text-text-muted">
                Segera hubungi bantuan bila muncul nyeri dada, sesak napas,
                pingsan, atau kelemahan mendadak.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;

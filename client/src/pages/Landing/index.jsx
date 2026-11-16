// ============================================================
// client/src/pages/Landing/index.jsx
// Landing page publik VITARA, adaptasi gaya editorial Stack Health
// (mystack.com) dengan palet dan identitas VITARA:
//   • Kanvas sage #f2f5f4 (dibanding kuning Stack), tinta pine gelap,
//     satu-satunya aksen mint #2fa58f
//   • Headline sans ekstra-tebal rapat, body dan kutipan serif Fraunces
//   • Tombol pil + tombol panah bundar menempel (ciri khas Stack)
//   • Ilustrasi line-art ojol (berkas PNG transparan), bukan foto / bukan stok AI
//   • Tanpa badge mengambang, dot online, gradien, atau ikon kartu
//   • Tanpa em-dash di mana pun
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ---------- Garis ECG kecil (hiasan tunggal) ---------- */
const PulseLine = ({ className = "" }) => (
  <svg viewBox="0 0 600 120" className={className} aria-hidden="true" fill="none">
    <path
      className="pulse-anim"
      d="M0 60 H120 L138 60 L152 18 L172 102 L188 42 L200 60 H260 L278 60 L292 30 L308 90 L322 52 L334 60 H420 L438 60 L452 10 L474 110 L490 46 L502 60 H600"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- Reveal saat scroll (sekali, halus) ---------- */
const Reveal = ({ children, delay = 0, className = "", as: Tag = "div" }) => {
  const ref = useRef(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entri) => {
        entri.forEach((e) => {
          if (e.isIntersecting) {
            setTerlihat(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${terlihat ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

/* ---------- Tombol pil + panah bundar menempel (gaya Stack) ----------
   Varian ghost memakai satu pil outline utuh dengan panah di dalamnya,
   agar tidak ada dua bulatan yang saling menindih di atas gradien. */
const PillButton = ({ to, href, variant = "dark", children }) => {
  const isGhost = variant === "ghost";
  const padat =
    variant === "dark"
      ? "bg-[#163532] text-[#f2f5f4] group-hover:bg-[#23524e]"
      : "bg-white text-[#163532] border border-transparent group-hover:bg-[#eef4f2]";

  let isi;
  if (isGhost) {
    isi = (
      <span className="inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-full border border-white/40 pl-6 pr-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-300 group-hover:bg-white/10 sm:h-14 sm:text-[13px]">
        {children}
        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">arrow_forward</span>
      </span>
    );
  } else {
    isi = (
      <>
        <span className={`inline-flex h-12 items-center whitespace-nowrap rounded-full pl-6 pr-5 text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-300 sm:h-14 sm:text-[13px] ${padat}`}>
          {children}
        </span>
        <span className={`-ml-2 inline-flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1 sm:h-14 sm:w-14 ${padat}`}>
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">arrow_forward</span>
        </span>
      </>
    );
  }

  const kelas = "group inline-flex items-center";
  if (to) return <Link to={to} className={kelas}>{isi}</Link>;
  return <a href={href} className={kelas}>{isi}</a>;
};

/* ---------- Ilustrasi hero: berkas line-art ojol (public/hero-ojol.png)
   Garis putih + aksen mint di atas latar transparan, dipakai di hero. */

/* ---------- Data teks (Bahasa Indonesia, tanpa em-dash) ---------- */
const KATA_HERO = ["Dari", "Catatan,", "Jadi", "Pemulihan"];

const KELUHAN = [
  { kutipan: "Pinggang rasanya hancur setiap pulang shift.", teks: "Duduk lebih dari 10 jam menghantam tulang belakang. Kamu merasakannya, kamu cuma belum tahu harus berbuat apa." },
  { kutipan: "Saya bingung harus periksa ke mana.", teks: "Cari klinik, cek jam buka, tanya biaya, antre lama. Saat badan sudah sakit, semuanya terasa melelahkan." },
  { kutipan: "Biaya dokter mahal, penghasilan tidak menentu.", teks: "Sekali sakit bisa menggerus pendapatan seminggu. Jauh lebih murah mencegah sejak shift pertama." },
];

const PILIHAN = {
  durasi: { label: "Durasi shift", opsi: ["8 jam", "10 jam", "12 jam"], skor: { "8 jam": 1, "10 jam": 2, "12 jam": 3 } },
  keluhan: { label: "Keluhan utama", opsi: ["Pinggang", "Leher", "Bahu"], skor: { Pinggang: 2, Leher: 1, Bahu: 2 } },
  posisi: { label: "Posisi kerja", opsi: ["Mengendarai", "Duduk", "Angkat barang"], skor: { Mengendarai: 2, Duduk: 1, "Angkat barang": 3 } },
};

const SARAN = {
  Pinggang: "Lutut ke dada 20 detik, 3 kali sehari. Atur jok setinggi panggul dan jangan bungkuk saat mengangkat.",
  Leher: "Chin tuck 3 kali sehari, layar sejajar mata, dan rehat leher setiap 2 jam.",
  Bahu: "Shoulder roll 10 kali tiap 2 jam dan jangan menggantung tas di satu bahu.",
};

export default function LandingPage() {
  const [pilih, setPilih] = useState({ durasi: "10 jam", keluhan: "Pinggang", posisi: "Mengendarai" });
  const [ketikan, setKetikan] = useState("");
  const [progresScroll, setProgresScroll] = useState(0);
  const [headerSembunyi, setHeaderSembunyi] = useState(false);
  const posisiGulir = useRef(0);

  /* Tema: landing berada di luar shell Layout, jadi class .dark
     dikelola di sini memakai kunci localStorage yang sama ("theme"). */
  const [gelap, setGelap] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (gelap) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [gelap]);

  /* Progress bar baca + header sembunyi saat scroll turun */
  useEffect(() => {
    const padaScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const tinggiDok = document.documentElement.scrollHeight - window.innerHeight;
      setProgresScroll(tinggiDok > 0 ? Math.min(100, Math.max(0, (y / tinggiDok) * 100)) : 0);
      setHeaderSembunyi(y > posisiGulir.current && y > 140);
      posisiGulir.current = y;
    };
    padaScroll();
    window.addEventListener("scroll", padaScroll, { passive: true });
    return () => window.removeEventListener("scroll", padaScroll);
  }, []);

  /* Skor & saran dari pilihan chip */
  const skor =
    PILIHAN.durasi.skor[pilih.durasi] +
    PILIHAN.keluhan.skor[pilih.keluhan] +
    PILIHAN.posisi.skor[pilih.posisi];
  const labelSkor = skor <= 4 ? "Ringan" : skor <= 6 ? "Sedang" : "Berat";
  const naskah = `Ergo-Coach: Shift ${pilih.durasi} dengan posisi ${pilih.posisi} membebani area ${pilih.keluhan}. Risk Score ${labelSkor}. ${SARAN[pilih.keluhan]}`;

  /* Typewriter untuk jawaban Ergo-Coach */
  useEffect(() => {
    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (kurangGerak) {
      setKetikan(naskah);
      return undefined;
    }
    setKetikan("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setKetikan(naskah.slice(0, i));
      if (i >= naskah.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilih]);

  return (
    <div className="min-h-screen overflow-x-clip bg-tekstur-kanvas text-text-primary">
      {/* ============ HEADER (gaya gelap ikonik VITARA) ============ */}
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0d2422]/80 backdrop-blur-md transition-transform duration-300 ${
          headerSembunyi ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="VITARA beranda">
            <span className="glass-icon flex h-9 w-9 items-center justify-center rounded-full text-white">
              <span className="material-symbols-outlined text-[18px]">vital_signs</span>
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-white lg:text-lg">VITARA</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setGelap((v) => !v)}
              aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
              title={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/90 transition hover:border-white/60 hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px]">{gelap ? "light_mode" : "dark_mode"}</span>
            </button>
            <Link to="/login" className="link-grow hidden text-sm font-medium text-white/75 transition-colors hover:text-white sm:inline-flex">
              Masuk
            </Link>
            <PillButton to="/register" variant="light">Daftar</PillButton>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-transparent" aria-hidden="true">
          <div className="h-full bg-[#2fa58f] transition-[width] duration-150 ease-out" style={{ width: `${progresScroll}%` }} />
        </div>
      </header>

      {/* ============ HERO (di atas gradien hijau-putih khas VITARA) ============ */}
      <section className="hero-gradient-landing overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-end gap-10 px-5 pb-14 pt-24 sm:px-8 sm:pt-28 lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-36">
          <div className="lg:col-span-7">
            <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[5rem]">
              {KATA_HERO.map((kata, i) => (
                <React.Fragment key={i}>
                  <span
                    className={`hero-word ${kata === "Pemulihan" ? "text-[#8ed3c4]" : ""}`}
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    {kata}
                  </span>
                  {i === 1 ? <br /> : " "}
                </React.Fragment>
              ))}
            </h1>
            <p className="mt-7 max-w-xl font-editorial text-xl leading-relaxed text-[#c9d8d4] sm:text-2xl">
              VITARA mencatat keluhan, menganalisis postur, dan menemani setiap shift dengan saran ergonomi sederhana, dari kilometer pertama hingga pulang.
            </p>
            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <PillButton to="/register" variant="light">Daftar</PillButton>
              <PillButton href="#cara-kerja" variant="ghost">Lihat cara kerja</PillButton>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img
              src="/hero-ojol.png"
              alt="Ilustrasi line-art pengendara motor ojek dengan kotak pengantaran dan bubble bertuliskan Pegal?"
              className="ml-auto h-80 w-auto max-w-full sm:h-96 lg:h-[480px]"
            />
          </div>
        </div>
      </section>

      {/* ============ MASALAH: tiga kutipan ============ */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <h2 className="font-editorial text-3xl font-semibold leading-tight sm:text-5xl">
              Kerja lapangan<br />itu berat.
            </h2>
          </Reveal>
          <div className="mt-12 space-y-12 lg:mt-16 lg:space-y-16">
            {KELUHAN.map((k, i) => (
              <Reveal key={i} delay={i * 110} className="grid gap-3 sm:grid-cols-12 sm:gap-8">
                <p className="font-editorial text-2xl font-semibold italic leading-snug text-text-primary sm:col-span-6 sm:text-3xl">
                  “{k.kutipan}”
                </p>
                <p className="max-w-md self-end font-editorial text-base leading-relaxed text-text-muted sm:col-span-5 sm:col-start-8">
                  {k.teks}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRODUK + WIDGET 30 DETIK ============ */}
      <section id="cara-kerja" className="scroll-mt-24 border-t border-border-subtle bg-surface-subtle/50">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Dibuat khusus untuk pekerja lapangan.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-10 font-editorial text-lg leading-relaxed text-text-muted">
                Begini cara kerjanya. Tiga langkah saja, tanpa istilah medis:
              </p>
            </Reveal>
            <ol className="mt-6 space-y-6 border-t border-border-subtle pt-6">
              {[
                { nomor: "01", judul: "Catat dalam 30 detik.", teks: "Ketik atau bicara: berapa lama shift, posisi kerja, dan bagian badan yang sakit. Tanpa formulir panjang." },
                { nomor: "02", judul: "Ergo-Coach menganalisis.", teks: "VITARA membaca riwayat catatanmu, menilai risikonya, lalu menjelaskan penyebabnya dengan bahasa sehari-hari." },
                { nomor: "03", judul: "Praktik dan pantau.", teks: "Ikuti saran peregangan harian, lihat progres di dashboard, dan bila darurat langsung ke faskes atau 119." },
              ].map((langkah, i) => (
                <Reveal as="li" key={langkah.nomor} delay={220 + i * 110} className="flex gap-5">
                  <span className="font-editorial text-sm font-semibold leading-6 text-[#2fa58f]">{langkah.nomor}</span>
                  <span>
                    <span className="block font-editorial text-xl font-semibold text-text-primary">{langkah.judul}</span>
                    <span className="mt-1 block font-editorial leading-relaxed text-text-muted">{langkah.teks}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>

          {/* Widget interaktif ala selektor Stack */}
          <Reveal delay={150} className="lg:col-span-6 lg:col-start-7">
            <div className="rounded-4xl border border-border-subtle bg-white p-6 shadow-soft sm:p-8 dark:bg-[#12201d]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Coba 30 detik</p>
              <p className="mt-2 font-editorial text-xl font-semibold">Isi tiga hal ini, Ergo-Coach langsung jawab.</p>

              {Object.entries(PILIHAN).map(([kunci, grup]) => (
                <fieldset key={kunci} className="mt-6">
                  <legend className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">{grup.label}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {grup.opsi.map((opsi) => {
                      const aktif = pilih[kunci] === opsi;
                      return (
                        <button
                          key={opsi}
                          type="button"
                          onClick={() => setPilih((p) => ({ ...p, [kunci]: opsi }))}
                          aria-pressed={aktif}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                            aktif
                              ? "border-[#163532] bg-[#163532] text-[#f2f5f4] dark:border-[#a9cec7] dark:bg-[#a9cec7] dark:text-[#0d1c1b]"
                              : "border-border-subtle bg-transparent text-text-muted hover:border-[#163532] hover:text-text-primary dark:border-[#263834] dark:hover:border-[#a9cec7]"
                          }`}
                        >
                          {opsi}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              {/* Jawaban Ergo-Coach mengetik otomatis */}
              <div className="mt-6 rounded-3xl border border-border-subtle bg-surface-subtle p-5 dark:bg-[#1d2e29]" aria-live="polite">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Risk Score · {labelSkor}</p>
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-container" aria-hidden="true">
                    <div className="h-full rounded-full bg-[#2fa58f] transition-all duration-700 ease-out" style={{ width: `${(skor / 8) * 100}%` }} />
                  </div>
                </div>
                <p className="mt-3 min-h-[72px] font-body text-[15px] leading-relaxed text-text-primary">
                  {ketikan}
                  {ketikan.length < naskah.length && (
                    <span aria-hidden="true" className="caret-blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-[#2fa58f] align-baseline" />
                  )}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ AI CEPAT, MANUSIA KAPAN PUN ============ */}
      <section id="fitur" className="scroll-mt-24 border-t border-border-subtle">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <h2 className="max-w-2xl font-editorial text-3xl font-semibold leading-tight sm:text-5xl">
              AI yang cepat, manusia kapan pun.
            </h2>
          </Reveal>
          <ul className="mt-12 divide-y divide-border-subtle border-y border-border-subtle">
            {[
              { nama: "Ergo-Coach AI.", teks: "Jawaban ergonomi dalam hitungan detik, kapan pun kamu tanya, tanpa perlu istilah medis." },
              { nama: "Catatan Harian.", teks: "Durasi, posisi, dan keluhan tercatat rapi dalam 30 detik, seperti kirim pesan singkat." },
              { nama: "Faskes & 119.", teks: "Saat keluhan berat, VITARA langsung arahkan ke puskesmas terdekat atau hubungi 119." },
            ].map((f, i) => (
              <Reveal as="li" key={f.nama} delay={i * 100} className="group grid gap-2 py-6 transition-transform duration-300 hover:translate-x-1 sm:grid-cols-12 sm:gap-6">
                <span className="font-editorial text-xl font-semibold text-text-primary sm:col-span-4 sm:text-2xl">{f.nama}</span>
                <span className="font-editorial leading-relaxed text-text-muted sm:col-span-7 sm:col-start-6">{f.teks}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ BAND PINE: PERNYATAAN ============ */}
      <section className="bg-[#163532] text-[#f2f5f4]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <h2 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Kesehatanmu, milikmu. Kami yang urus sisanya.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-8 max-w-2xl font-editorial text-lg leading-relaxed text-[#a9c2bd] sm:text-xl">
              Kami ingin mengubah cara pekerja informal menjaga badan: dari sakit lalu berobat, menjadi cegah sejak shift pertama. VITARA menemani setiap hari kerja, bukan hanya saat kamu sudah di klinik.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <PulseLine className="mt-12 h-14 w-full max-w-2xl text-[#2fa58f]/70" />
          </Reveal>
        </div>
      </section>

      {/* ============ TIGA PERAN ============ */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:grid-cols-3 sm:px-8 lg:py-20">
          {[
            { label: "Kamu", judul: "Cerita dan keluhan.", teks: "Ketik atau bicara sejak shift pertama, tanpa perlu istilah medis." },
            { label: "Vitara", judul: "Analisis dan saran.", teks: "AI membaca riwayat catatanmu, lalu beri langkah peregangan dan postur yang pas." },
            { label: "Bersama", judul: "Pantau sampai membaik.", teks: "Progres terlihat di dashboard, dan faskes terdekat selalu siap dirujuk." },
          ].map((kol, i) => (
            <Reveal key={kol.label} delay={i * 120}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2fa58f]">{kol.label}</p>
              <h3 className="mt-3 font-editorial text-2xl font-semibold">{kol.judul}</h3>
              <p className="mt-3 font-editorial leading-relaxed text-text-muted">{kol.teks}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ KAMI MENANG BILA KAMU SEHAT ============ */}
      <section className="border-t border-border-subtle bg-surface-subtle/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Kami menang bila kamu sehat.
            </h2>
            <p className="mt-6 max-w-xl font-editorial text-lg leading-relaxed text-text-muted">
              Kami tidak menjual obat. Kami membantumu memahami badanmu sendiri, satu shift demi satu shift.
            </p>
          </Reveal>
          <div className="mt-10 space-y-2">
            {["Tanpa dijual.", "Tanpa syarat.", "Hanya teman di sisimu."].map((baris, i) => (
              <Reveal key={baris} delay={i * 120} className="flex items-baseline gap-4 border-t border-border-subtle py-5">
                <span className="font-editorial text-sm text-[#2fa58f]">0{i + 1}</span>
                <span className={`font-editorial text-3xl font-semibold sm:text-4xl ${i === 2 ? "text-primary" : "text-text-primary"}`}>{baris}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <Reveal>
            <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Siap jaga badanmu mulai hari ini?
            </h2>
          </Reveal>
          <Reveal delay={140} className="flex flex-col items-start gap-4">
            <PillButton to="/register">Mulai sekarang</PillButton>
            <p className="font-editorial text-sm text-text-muted">Gratis · 1 menit · Tanpa kartu kredit</p>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-editorial">
            VITARA bukan pengganti diagnosis dokter. Untuk darurat, hubungi 119.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">Masuk</Link>
            <a href="#cara-kerja" className="transition-colors hover:text-primary">Cara kerja</a>
            <span>© 2026 VITARA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
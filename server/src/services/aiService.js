// ============================================================
// aiService.js — Milik P2 (Ergo-Coach AI)
// Integrasi LangChain + Google Gemini untuk analisis keluhan
// berdasarkan histori WorkLog (milik P1).
//
// Tanggung jawab file ini:
//  1. Inisialisasi model (Gemini).
//  2. Deteksi keyword darurat (guardrails) SEBELUM memanggil LLM.
//  3. Menentukan mode cold start berdasarkan jumlah log.
//  4. Membangun prompt dari keluhan user + ringkasan WorkLog.
//  5. Mem-parsing jawaban LLM menjadi JSON terstruktur.
// ============================================================
require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

// Nama model default. Catatan (Nov 2026): "gemini-2.0-flash" sudah
// DI-PENSIUNKAN Google (HTTP 404). "gemini-3.8-flash" terdaftar tetapi
// sering membalas 503 (overload), jadi default kita gemini-3.6-flash
// yang stabil. Bisa dioverride lewat env GEMINI_MODEL.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Batas waktu satu panggilan LLM. Tanpa ini, retry bawaan LangChain bisa
// membuat request HTTP menggantung sangat lama saat Gemini 503.
const LLM_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;

// API key diambil dari environment variable GEMINI_API_KEY.
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error(
    "[aiService] GEMINI_API_KEY belum diisi. Salin server/.env.example menjadi server/.env lalu isi API key."
  );
}

// ===
// Inisialisasi LangChain dengan model Gemini
// ===
const llm = new ChatGoogleGenerativeAI({
  apiKey, // eksplisit agar tidak bergantung pada nama env tertentu
  model: MODEL_NAME,
  temperature: 1.0, // WAJIB 1.0 untuk Gemini 3.0+ (0.7 bisa menurunkan reasoning / infinite loop)
  maxRetries: 1, // Gemini kadang 429/503 saat beban tinggi; 1 retry sudah cukup
});

// Disclaimer wajib di setiap respons AI (PRD & P2_PRIVATE.md).
const DISCLAIMER =
  "Ini bukan diagnosis medis. Konsultasikan ke dokter atau fasilitas kesehatan terdekat jika keluhan berlanjut.";

// Keyword darurat sesuai P2_PRIVATE.md. Jika terdeteksi, pesan TIDAK
// dikirim ke LLM — langsung dibalas peringatan darurat.
const EMERGENCY_KEYWORDS = [
  "nyeri dada",
  "nyeri di dada",
  "dada terasa nyeri",
  "sesak napas",
  "sesak nafas",
  "pingsan",
];

/**
 * Deteksi keyword darurat pada teks keluhan user.
 * @param {string} teks
 * @returns {{ isEmergency: boolean, matchedKeywords: string[] }}
 */
function detectEmergency(teks = "") {
  const normalized = String(teks).toLowerCase();
  const matchedKeywords = EMERGENCY_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword)
  );
  return { isEmergency: matchedKeywords.length > 0, matchedKeywords };
}

/**
 * Tentukan mode cold start berdasarkan jumlah log yang tersedia.
 * - < 3 log   → KONSERVATIF (data minim, saran umum & aman)
 * - 3-6 log   → TRANSISI (pola mulai terlihat)
 * - >= 7 log  → POLA_LENGKAP (analisis korelasi penuh)
 * @param {number} jumlahLog
 */
function determineMode(jumlahLog) {
  if (jumlahLog >= 7) {
    return { mode: "POLA_LENGKAP", label: "Pola Lengkap" };
  }
  if (jumlahLog >= 3) {
    return { mode: "TRANSISI", label: "Transisi" };
  }
  return { mode: "KONSERVATIF", label: "Konservatif" };
}

/**
 * Ubah array WorkLog menjadi baris ringkas untuk prompt.
 * @param {Array<{workHours:number, income:number|null, symptoms:string[], createdAt:Date|string}>} logs
 */
function formatLogsForPrompt(logs = []) {
  if (!logs.length) {
    return "- (Belum ada catatan log kerja sama sekali)";
  }

  return logs
    .map((log, index) => {
      const tanggal = new Date(log.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const pendapatan =
        log.income === null || log.income === undefined
          ? "tidak dicatat"
          : `Rp${Number(log.income).toLocaleString("id-ID")}`;
      const keluhan =
        Array.isArray(log.symptoms) && log.symptoms.length
          ? log.symptoms.join(", ")
          : "tidak ada keluhan";

      return `${index + 1}. ${tanggal} — jam kerja: ${log.workHours} jam, pendapatan: ${pendapatan}, keluhan: ${keluhan}`;
    })
    .join("\n");
}

/**
 * Bangun prompt lengkap (instruksi + data log + keluhan user).
 * Output LLM dipaksa berupa JSON sesuai kontrak P2_PRIVATE.md.
 */
function buildPrompt({ userMessage, logs = [], mode, userName }) {
  const instruksiMode = {
    KONSERVATIF:
      "Data log masih sangat sedikit (<3 entri). JANGAN mengarang pola atau korelasi. Berikan saran ergonomi umum yang aman dan ajak user mencatat log harian agar analisis berikutnya lebih akurat.",
    TRANSISI:
      "Data log tergolong sedang (3-6 entri). Sebutkan pola awal yang TERLIHAT dari data, tetapi tegaskan bahwa kesimpulan masih sementara karena data belum lengkap.",
    POLA_LENGKAP:
      "Data log sudah lengkap (>=7 entri). Analisis korelasi antara jam kerja, pendapatan, dan keluhan fisik. Sebutkan pola yang konsisten terlihat dari data.",
  };

  return `Kamu adalah "Ergo-Coach AI", asisten kesehatan kerja untuk pekerja informal Indonesia (driver ojol, kurir, pedagang). Tugasmu menganalisis keluhan fisik berdasarkan histori catatan kerja user.

MODE ANALISIS: ${mode.label} (${mode.mode})
${instruksiMode[mode.mode] || ""}

PROFIL USER:
- Nama: ${userName || "Mitra VITARA"}
- Jumlah log yang dianalisis: ${logs.length}

HISTORI LOG KERJA (7 hari terakhir):
${formatLogsForPrompt(logs)}

KELUHAN USER SAAT INI:
"${userMessage}"

ATURAN JAWABAN:
1. Balas HANYA dengan JSON valid, tanpa markdown, tanpa teks pembuka/penutup.
2. Gunakan Bahasa Indonesia yang sederhana, ramah, dan mudah dipahami pekerja.
3. Jangan pernah memberi diagnosis medis pasti. Jangan meresepkan obat keras.
4. saran_otc hanya obat bebas (OTC) umum beserta dosis maksimal yang lazim, dan ingatkan baca kemasan.
5. Jika keluhan berpotensi berbahaya, isi "peringatan" dengan arahan menghubungi 119/IGD.
6. "disclaimer" WAJIB berisi persis: "${DISCLAIMER}"

FORMAT JSON YANG WAJIB DIPATUHI:
{
  "analisis": "ringkasan singkat penyebab keluhan berdasarkan pola kerja",
  "rencana_pemulihan": [
    { "judul": "nama langkah", "detail": "penjelasan singkat langkah pemulihan" }
  ],
  "saran_otc": [
    { "nama": "nama obat bebas", "detail": "dosis/penggunaan singkat dan peringatan kemasan" }
  ],
  "peringatan": "peringatan atau arahan rujukan (boleh string kosong jika tidak ada)",
  "disclaimer": "${DISCLAIMER}"
}`;
}

/**
 * Kirim prompt ke LLM dan kembalikan teks mentah.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function invokeLLM(prompt) {
  // Guard timeout: jangan biarkan request user menggantung tanpa batas.
  const jawaban = await Promise.race([
    llm.invoke(prompt),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Waktu tunggu Gemini habis (${LLM_TIMEOUT_MS} ms). Coba lagi beberapa saat.`
            )
          ),
        LLM_TIMEOUT_MS
      )
    ),
  ]);

  return typeof jawaban.content === "string"
    ? jawaban.content
    : JSON.stringify(jawaban.content);
}

/**
 * Normalisasi daftar (rencana_pemulihan / saran_otc) menjadi array objek
 * { judul|nama, detail } agar aman dipakai UI, apa pun bentuk dari LLM.
 */
function normalisasiDaftar(nilai, fieldJudul) {
  if (!nilai) return [];
  if (typeof nilai === "string") {
    return [{ [fieldJudul]: nilai, detail: "" }];
  }
  if (Array.isArray(nilai)) {
    return nilai
      .map((item) => {
        if (typeof item === "string") {
          return { [fieldJudul]: item, detail: "" };
        }
        if (item && typeof item === "object") {
          const judul = item.judul || item.nama || item.title || "Langkah";
          const detail = item.detail || item.deskripsi || item.description || "";
          return { [fieldJudul]: String(judul), detail: String(detail) };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof nilai === "object") {
    return [
      {
        [fieldJudul]: String(nilai.judul || nilai.nama || "Langkah"),
        detail: String(nilai.detail || nilai.deskripsi || ""),
      },
    ];
  }
  return [];
}

/**
 * Parse jawaban LLM menjadi JSON terstruktur. Tahan terhadap markdown
 * code fence dan teks tambahan di luar objek JSON.
 */
function parseAIResponse(raw) {
  const teks = String(raw || "");
  // Buang blok ```json ... ```
  const tanpaFence = teks.replace(/```(?:json)?/gi, "").trim();
  // Ambil objek JSON pertama yang seimbang (dari '{' pertama sampai '}' terakhir)
  const awal = tanpaFence.indexOf("{");
  const akhir = tanpaFence.lastIndexOf("}");
  const kandidat =
    awal !== -1 && akhir > awal ? tanpaFence.slice(awal, akhir + 1) : tanpaFence;

  try {
    const parsed = JSON.parse(kandidat);
    return {
      analisis: String(parsed.analisis || "Belum ada analisis yang bisa disimpulkan."),
      rencana_pemulihan: normalisasiDaftar(parsed.rencana_pemulihan, "judul"),
      saran_otc: normalisasiDaftar(parsed.saran_otc, "nama"),
      peringatan: String(parsed.peringatan || ""),
      disclaimer: DISCLAIMER, // selalu dipaksa sesuai guardrail
    };
  } catch (err) {
    console.error("[aiService] Gagal parse JSON dari LLM:", err.message);
    // Fallback: jangan tampilkan teks bebas mentah ke UI, beri pesan aman.
    return {
      analisis:
        "Maaf, hasil analisis AI tidak dapat dibaca dengan format yang benar. Silakan coba kirim ulang keluhan Anda.",
      rencana_pemulihan: [],
      saran_otc: [],
      peringatan: "",
      disclaimer: DISCLAIMER,
    };
  }
}

/**
 * Respons darurat: dipakai TANPA memanggil LLM.
 */
function buatResponsDarurat(matchedKeywords, jumlahLog) {
  return {
    analisis:
      "Keluhan yang Anda sebutkan termasuk tanda bahaya (red flag) yang perlu penanganan medis segera, bukan cukup ditangani dengan istirahat atau obat bebas.",
    rencana_pemulihan: [
      {
        judul: "Hentikan aktivitas kerja",
        detail:
          "Berhenti mengemudi atau bekerja sekarang juga. Cari tempat aman untuk berhenti dan duduk/berbaring.",
      },
      {
        judul: "Minta bantuan orang terdekat",
        detail:
          "Hubungi keluarga, rekan, atau orang di sekitar Anda. Jangan berkendara sendiri dalam kondisi ini.",
      },
      {
        judul: "Hubungi layanan darurat",
        detail:
          "Segera hubungi 119 atau langsung menuju IGD rumah sakit terdekat.",
      },
    ],
    saran_otc: [],
    peringatan:
      "PERINGATAN DARURAT: keluhan Anda (" +
      matchedKeywords.join(", ") +
      ") dapat merupakan tanda kondisi serius. Jangan menunda — hubungi 119 atau kunjungi IGD terdekat sekarang.",
    disclaimer: DISCLAIMER,
    isEmergency: true,
    mode: "DARURAT",
    modeLabel: "Darurat",
    logCount: jumlahLog,
    matchedKeywords,
  };
}

/**
 * Fungsi utama: analisis keluhan user berdasarkan histori WorkLog.
 *
 * @param {Object} params
 * @param {string} params.userMessage - Keluhan user.
 * @param {Array}  [params.logs]      - WorkLog 7 hari terakhir (maks 7).
 * @param {string} [params.userName]  - Nama user (opsional).
 * @returns {Promise<Object>} JSON terstruktur siap dikirim ke frontend.
 */
async function analyzeComplaint({ userMessage, logs = [], userName }) {
  // 1. Guardrails: keyword darurat → jangan panggil LLM.
  const { isEmergency, matchedKeywords } = detectEmergency(userMessage);
  if (isEmergency) {
    return buatResponsDarurat(matchedKeywords, logs.length);
  }

  // 2. Tentukan mode berdasarkan jumlah log.
  const mode = determineMode(logs.length);

  // 3. Bangun prompt & panggil LLM.
  const prompt = buildPrompt({ userMessage, logs, mode, userName });
  const raw = await invokeLLM(prompt);

  // 4. Parse jadi JSON rapi.
  const hasil = parseAIResponse(raw);

  return {
    ...hasil,
    isEmergency: false,
    mode: mode.mode,
    modeLabel: mode.label,
    logCount: logs.length,
  };
}

// ============================================================
// API RISK SCORE (Minggu 3) — skor risiko kelelahan 0-100.
// Deterministik (tanpa LLM) agar respons cepat & gratis.
// Skala jam kerja lebih dari 8 jam + frekuensi keluhan.
// ============================================================

/** Batasi angka ke rentang [min, max]. */
function clampRange(nilai, min = 0, max = 1) {
  return Math.min(Math.max(nilai, min), max);
}

/**
 * Kunci tanggal lokal (YYYY-MM-DD) untuk deduplikasi log per hari.
 * Satu hari boleh punya lebih dari satu log (jam subnet).
 * @param {Date|string|number} tanggal
 */
function kunciHari(tanggal) {
  const d = new Date(tanggal);
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/**
 * Nama hari lokal untuk kalimat insight (Senin, dst).
 * @param {Date|string|number} tanggal
 */
function namaHari(tanggal) {
  return new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long" });
}

/**
 * Hitung skor risiko kelelahan harian dari daftar WorkLog.
 *
 * Komponen skor (total 100):
 *   1. Beban jam kerja     — maks 40 poin (rata-rata 3 hari terbaru, 6-13 jam)
 *   2. Keluhan fisik       — maks 30 poin (keluhan unik, yang baru x1,5)
 *   3. Tanpa hari libur    — maks 15 poin (hari kerja berturut-turut > 0 jam)
 *   4. Fluktuasi jam kerja — maks 15 poin (koefisien variasi)
 *
 * @param {Array}  logs  WorkLog terbaru dulu (orderBy createdAt desc).
 * @returns {Object} Skor + rincian komponen + mode cold start.
 */
function hitungSkorRisiko(logs = []) {
  const logData = [...logs];
  if (!logData.length) {
    return {
      skor: null,
      level: null,
      kepercayaan: null,
      mode: "KONSERVATIF",
      modeLabel: "Konservatif",
      jumlahLog: 0,
      komponen: [],
      pesan:
        "Belum ada log kerja untuk dianalisis. Catat aktivitas harian Anda agar skor risiko bisa dihitung.",
    };
  }

  // Rain manusia: kunci Hari -> { jam, keluhan } (riwayat diurutkan dari terbaru ke terlama)
  const sesuaiHari = new Map(); // Kunci Hari -> { jam, keluhan } gabungan
  for (const log of logData) {
    const key = kunciHari(log.createdAt);
    const entri = sesuaiHari.get(key) || { tanggal: log.createdAt, jam: 0, keluhan: [] };
    entri.jam += Number(log.workHours) || 0;
    entri.keluhan.push(...(Array.isArray(log.symptoms) ? log.symptoms : []));
    sesuaiHari.set(key, entri);
  }
  const hariList = [...sesuaiHari.values()]; // Terbaru dulu
  const jamList = logData.map((log) => Number(log.workHours) || 0); // Terbaru dulu

  // Ukuran dasar
  const rataRata = jamList.reduce((a, b) => a + b, 0) / jamList.length;
  const tigaHariTerbaru = jamList.slice(0, Math.min(3, jamList.length));
  const rataTigaHari = tigaHariTerbaru.reduce((a, b) => a + b, 0) / tigaHariTerbaru.length;
  const varian = jamList.reduce((a, b) => a + (b - rataRata) ** 2, 0) / jamList.length;
  const deviasi = Math.sqrt(varian);
  const koefisienVariasi = rataRata > 0 ? deviasi / rataRata : 0;

  // === 1. Beban jam kerja (maks 40) ===
  // 6 jam dianggap titik aman; 13 jam ke atas dianggap ekstrem.
  const poinJam = clampRange((rataTigaHari - 6) / (13 - 6)) * 40;
  const komponenJam = {
    nama: "Beban Jam Kerja",
    poin: Math.round(poinJam),
    maks: 40,
    bobot: "40%",
    detail: `Rata-rata ${tigaHariTerbaru.length} hari terakhir: ${rataTigaHari.toFixed(1)} jam/hari (rata-rata 7 hari: ${rataRata.toFixed(1)} jam).`,
  };

  // === 2. Keluhan fisik (maks 30) ===
  // Keluhan pada log TERBARU membobot 1.5x karena paling merefleksikan kondisi sekarang.
  const keluhanTerbaru = new Set(hariList[0].keluhan || []); // Hari ini
  const hitungKeluhan = new Map();
  for (const { keluhan } of hariList) {
    for (const k of keluhan) {
      const bersih = String(k).trim().toLowerCase();
      if (bersih && !(bersih.includes("bebas"))) {
        // Abaikan label "Bebas Keluhan & Bugar" dari P1
        hitungKeluhan.set(bersih, (hitungKeluhan.get(bersih) || 0) + 1);
      }
    }
  }
  let poinKeluhan = 0;
  for (const [k, jumlah] of hitungKeluhan) {
    let basis = Math.min(8, 6 + (jumlah - 1) * 3); // 6 poin pertama, +3 per pengulangan, maks 8
    if (keluhanTerbaru.has(k)) basis *= 1.5;
    poinKeluhan += basis;
  }
  const komponenKeluhan = {
    nama: "Keluhan Fisik",
    poin: Math.round(clampRange(poinKeluhan / 30) * 30),
    maks: 30,
    bobot: "30%",
    detail: hitungKeluhan.size
      ? `${hitungKeluhan.size} jenis keluhan tercatat${[...keluhanTerbaru].length ? ", beberapa masih dirasakan hari ini" : ""}.`
      : "Tidak ada keluhan fisik yang dicatat.",
  };

  // === 3. Tanpa hari libur (maks 15) ===
  // Hari kerja berturut-turut tanpa hari 0 jam menandakan pemulihan kurang.
  let hariKerjaBerturut = 0;
  for (const hari of hariList) {
    if (hari.jam > 0) hariKerjaBerturut++;
    else break;
  }
  const poinLibur = clampRange(hariKerjaBerturut / 6) * 15;
  const komponenLibur = {
    nama: "Tanpa Hari Libur",
    poin: Math.round(poinLibur),
    maks: 15,
    bobot: "15%",
    detail: hariKerjaBerturut >= 5
      ? `Anda bekerja ${hariKerjaBerturut} hari berturut-turut tanpa hari bebas.`
      : `${hariKerjaBerturut} hari kerja berturut-turut.`,
  };

  // === 4. Fluktuasi jam kerja (maks 15) ===
  const poinFluktuasi = clampRange(koefisienVariasi / 0.6) * 15;
  const komponenFluktuasi = {
    nama: "Fluktuasi Jam Kerja",
    poin: Math.round(poinFluktuasi),
    maks: 15,
    bobot: "15%",
    detail: `${klasifikasiFluktuasi(koefisienVariasi)} (deviasi ${deviasi.toFixed(1)} jam dari rata-rata).`,
  };

  const komponen = [komponenJam, komponenKeluhan, komponenLibur, komponenFluktuasi];
  const skor = Math.min(100, Math.round(komponen.reduce((a, k) => a + k.poin, 0)));

  // Level harus sinkron dengan widget Dashboard P3 (AiInsightWidget):
  // >= 70 Tinggi, >= 40 Sedang, selainnya Rendah.
  const level = skor >= 70 ? "Risiko Tinggi" : skor >= 40 ? "Risiko Sedang" : "Risiko Rendah";

  const mode = determineMode(logData.length);
  const kepercayaan =
    logData.length >= 7 ? "tinggi" : logData.length >= 3 ? "sedang" : "rendah";

  return {
    skor,
    level,
    kepercayaan,
    mode: mode.mode,
    modeLabel: mode.label,
    jumlahLog: logData.length,
    komponen,
    saran: buatSaranRisiko(komponen, skor),
  };
}

function klasifikasiFluktuasi(cv) {
  if (cv >= 0.45) return "Jam kerja sangat tidak konsisten (lonjakan beban)";
  if (cv >= 0.25) return "Jam kerja cukup bervariasi";
  return "Jam kerja cukup konsisten";
}

/**
 * Saran risiko dari komponen berbobot terbesar.
 */
function buatSaranRisiko(komponen, skor) {
  const dominan = [...komponen].sort((a, b) => b.poin / b.maks - a.poin / a.maks)[0];
  if (skor >= 70) {
    return `Risiko tinggi didominasi faktor "${dominan.nama}". Sebaiknya kurangi durasi kerja hari ini atau ambil hari libur bila memungkinkan, lalu konsultasikan keluhan ke Ergo-Coach AI.`;
  }
  if (skor >= 40) {
    return `Perhatikan faktor "${dominan.nama}". Lakukan peregangan terjadwal setiap 2 jam kerja, perhatikan hidrasi, dan pastikan satu hari bebas dalam sepekan.`;
  }
  return `Kondisi masih terkendali. Faktor terbesar saat ini "${dominan.nama}" — pertahankan pola istirahat dan tetap catat log harian.`;
}

// ============================================================
// API WEEKLY INSIGHT (Minggu 4) — ringkasan evaluasi mingguan.
// Deterministik (tanpa LLM) karena widget Dashboard dimuat
// tiap kali halaman dibuka — tidak boleh membebani Gemini.
// ============================================================

/**
 * Buat ringkasan mingguan dari WorkLog 14 hari terakhir.
 * Membandingkan 7 hari terakhir vs 7 hari sebelumnya.
 *
 * @param {Array} logs WorkLog terbaru dulu (maks 14).
 * @returns {Object} { ringkasan, data, disclaimer }
 */
function buatInsightMingguan(logs = []) {
  if (!logs.length) {
    return {
      ringkasan:
        "Belum ada data log untuk dianalisis. Mulai catat jam kerja dan keluhan Anda setiap hari untuk mendapatkan evaluasi mingguan.",
      data: null,
      disclaimer: DISCLAIMER,
    };
  }

  const batasKemarin = new Date();
  batasKemarin.setHours(0, 0, 0, 0);
  batasKemarin.setDate(batasKemarin.getDate() - 7);

  const mingguIni = [];
  const mingguLalu = [];
  for (const log of logs) {
    const created = new Date(log.createdAt);
    (created >= batasKemarin ? mingguIni : mingguLalu).push(log);
  }

  const totalMingguIni = mingguIni.reduce((a, l) => a + (Number(l.workHours) || 0), 0);
  const totalMingguLalu = mingguLalu.reduce((a, l) => a + (Number(l.workHours) || 0), 0);
  const hariAktifIni = mingguIni.length || 0;
  const rataIni = hariAktifIni ? totalMingguIni / hariAktifIni : 0;
  const rataLalu = mingguLalu.length ? totalMingguLalu / mingguLalu.length : 0;

  // Hari puncak beban dalam 14 hari
  const sesuaiHari = new Map();
  for (const log of logs) {
    const key = kunciHari(log.createdAt);
    const entri = sesuaiHari.get(key) || { tanggal: log.createdAt, jam: 0, keluhan: [] };
    entri.jam += Number(log.workHours) || 0;
    entri.keluhan.push(...(Array.isArray(log.symptoms) ? log.symptoms : []));
    sesuaiHari.set(key, entri);
  }
  const hariAll = [...sesuaiHari.values()];
  const puncak = [...hariAll].sort((a, b) => b.jam - a.jam)[0];

  // Keluhan & korelasi jam vs keluhan
  const hitungKeluhan = new Map();
  for (const { keluhan } of hariAll) {
    for (const k of keluhan) {
      const bersih = String(k).trim().toLowerCase();
      if (bersih && !bersih.includes("bebas")) {
        hitungKeluhan.set(bersih, (hitungKeluhan.get(bersih) || 0) + 1);
      }
    }
  }
  const keluhanFavorit = [...hitungKeluhan.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  // Hari dengan keluhan nyata vs hari bebas keluhan (label "Bebas ..." dianggap sehat)
  const punyaKeluhanAsli = (keluhan) =>
    keluhan.some((k) => {
      const bersih = String(k).trim().toLowerCase();
      return bersih && !bersih.includes("bebas");
    });
  const denganKeluhan = hariAll.filter((h) => punyaKeluhanAsli(h.keluhan));
  const tanpaKeluhan = hariAll.filter((h) => !punyaKeluhanAsli(h.keluhan));
  const rataDenganKeluhan = denganKeluhan.length ? denganKeluhan.reduce((a, h) => a + h.jam, 0) / denganKeluhan.length : null;
  const rataTanpaKeluhan = tanpaKeluhan.length ? tanpaKeluhan.reduce((a, h) => a + h.jam, 0) / tanpaKeluhan.length : null;

  // Tren minggu ini vs minggu lalu
  let arah = "stabil";
  let selisihPersen = 0;
  if (rataLalu > 0 && rataIni > 0) {
    selisihPersen = Math.round(((rataIni - rataLalu) / rataLalu) * 100);
    if (selisihPersen >= 15) arah = "naik";
    else if (selisihPersen <= -15) arah = "turun";
  }

  const hariPuncakText = `${namaHari(puncak.tanggal)} (${puncak.jam} jam)`;
  const kalimKorelasi =
    rataDenganKeluhan !== null && rataTanpaKeluhan !== null && rataTanpaKeluhan > 0
      ? rataDenganKeluhan > rataTanpaKeluhan
        ? `Hari yang Anda bekerja lebih lama cenderung berakhir dengan keluhan (rata-rata ${rataDenganKeluhan.toFixed(1)} jam vs ${rataTanpaKeluhan.toFixed(1)} jam pada hari tanpa keluhan) — indikasi korelasi beban-kelelahan.`
        : `Keluhan muncul meski rata-rata jam kerja Anda tidak lebih panjang (${rataDenganKeluhan.toFixed(1)} vs ${rataTanpaKeluhan.toFixed(1)} jam) — periksa postur dan kelengkapan alat perlindungan diri.`
      : "";

  const ringkasan = [
    `Dalam 14 hari terakhir Anda mencatat ${hariAll.length} hari kerja (total ${totalMingguIni + totalMingguLalu} jam, rata-rata ${rataIni.toFixed(1)} jam/hari ini).`,
    `Beban tertinggi jatuh pada ${hariPuncakText}${keluhanFavorit ? `, dan keluhan paling sering muncul adalah "${keluhanFavorit[0]}" (${keluhanFavorit[1]} kali)` : ""}.`,
    kalimKorelasi,
    selisihPersen !== 0 && totalMingguLalu > 0
      ? `Rata-rata jam kerja minggu ini ${arah} ${Math.abs(selisihPersen)}% dibanding minggu sebelumnya.`
      : "",
    arah === "naik" || (rataIni >= 9)
      ? "Jika pola ini berlanjut, pertimbangkan menambah jeda 10 menit setiap 3 jam berkendara dan jaga posisi duduk ergonomis."
      : "Pertahankan pola ini, tetap catat log harian agar analisis makin akurat.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ringkasan,
    data: {
      totalJam14Hari: totalMingguIni + totalMingguLalu,
      totalJam: totalMingguIni,
      rataRataJamHari: Number(rataIni.toFixed(1)),
      rataRataJamHariLalu: Number(rataLalu.toFixed(1)),
      hariPuncak: { hari: namaHari(puncak.tanggal), jam: puncak.jam },
      keluhanUtama: keluhanFavorit
        ? { nama: keluhanFavorit[0], jumlah: keluhanFavorit[1] }
        : null,
      tren: { arah, persen: selisihPersen },
      jumlahHariData: hariAll.length,
    },
    disclaimer: DISCLAIMER,
  };
}

module.exports = {
  llm,
  invokeLLM,
  analyzeComplaint,
  detectEmergency,
  determineMode,
  parseAIResponse,
  buildPrompt,
  hitungSkorRisiko,
  buatInsightMingguan,
  MODEL_NAME,
  DISCLAIMER,
  EMERGENCY_KEYWORDS,
};

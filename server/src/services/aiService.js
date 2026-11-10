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

module.exports = {
  llm,
  invokeLLM,
  analyzeComplaint,
  detectEmergency,
  determineMode,
  parseAIResponse,
  buildPrompt,
  MODEL_NAME,
  DISCLAIMER,
  EMERGENCY_KEYWORDS,
};

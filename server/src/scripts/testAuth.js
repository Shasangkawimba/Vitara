// ============================================================
// server/src/scripts/testAuth.js
// Script uji cepat untuk validasi modul Auth & Logger milik P1.
// Mencakup: Zod schema, JWT, Bcrypt, normalisasi telepon, deduplikasi symptom.
// Jalankan dengan: npm --prefix server run test:auth
// ============================================================
const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("=== Memulai Uji Otomatis Modul P1 (Auth & Work-Health Logger) ===\n");

async function runTests() {
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // === Fungsi Normalisasi Nomor Telepon (sama persis dengan auth.js) ===
  function normalizePhone(phone) {
    let cleaned = phone.replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+62")) {
      cleaned = "0" + cleaned.slice(3);
    } else if (cleaned.startsWith("62") && cleaned.length >= 11) {
      cleaned = "0" + cleaned.slice(2);
    } else if (cleaned.startsWith("8") && !cleaned.startsWith("0")) {
      cleaned = "0" + cleaned;
    }
    return cleaned;
  }

  // === 1. Uji Validasi Register Zod (dengan normalisasi telepon) ===
  const registerSchema = z.object({
    phone: z.string().trim()
      .transform(normalizePhone)
      .pipe(z.string().min(10).max(15).regex(/^[0-9]+$/)),
    password: z.string().min(6),
    name: z.string().trim().min(2),
    occupation: z.string().optional(),
  });

  const validRegister = registerSchema.safeParse({
    phone: "08123456789",
    password: "password123",
    name: "Budi Santoso",
    occupation: "Driver Ojol (Motor)",
  });
  assert(validRegister.success === true, "Validasi pendaftaran user dengan input benar");

  const invalidPhone = registerSchema.safeParse({
    phone: "123", // Terlalu pendek
    password: "password123",
    name: "Budi",
  });
  assert(invalidPhone.success === false, "Penolakan pendaftaran jika nomor telepon terlalu pendek");

  const invalidPass = registerSchema.safeParse({
    phone: "08123456789",
    password: "123", // Kurang dari 6 karakter
    name: "Budi",
  });
  assert(invalidPass.success === false, "Penolakan pendaftaran jika kata sandi kurang dari 6 karakter");

  // === 2. Uji Normalisasi Nomor Telepon (Minggu 4) ===
  const normalizeTest1 = registerSchema.safeParse({
    phone: "+6281234567890",
    password: "password123",
    name: "Rina",
  });
  assert(
    normalizeTest1.success === true && normalizeTest1.data.phone === "081234567890",
    "Normalisasi telepon +62xxx → 0xxx berhasil"
  );

  const normalizeTest2 = registerSchema.safeParse({
    phone: "6281234567890",
    password: "password123",
    name: "Adi",
  });
  assert(
    normalizeTest2.success === true && normalizeTest2.data.phone === "081234567890",
    "Normalisasi telepon 62xxx → 0xxx berhasil"
  );

  const normalizeTest3 = registerSchema.safeParse({
    phone: "81234567890",
    password: "password123",
    name: "Dewi",
  });
  assert(
    normalizeTest3.success === true && normalizeTest3.data.phone === "081234567890",
    "Normalisasi telepon 8xxx → 08xxx berhasil"
  );

  // === 3. Uji Hashing Bcrypt ===
  const plainPassword = "rahasiaMitra2024";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrongMatch = await bcrypt.compare("kataSandiSalah", hash);

  assert(isMatch === true, "Bcrypt berhasil memverifikasi kata sandi yang cocok");
  assert(isWrongMatch === false, "Bcrypt menolak kata sandi yang tidak cocok");

  // === 4. Uji JWT Signing & Verifikasi ===
  const secret = "test_secret_vitara";
  const payload = { id: "user_123", phone: "08123456789", name: "Budi" };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  const decoded = jwt.verify(token, secret);

  assert(decoded.id === "user_123" && decoded.name === "Budi", "JWT token berhasil ditandatangani dan diverifikasi");

  // === 5. Uji Validasi WorkLog Create Zod (Minggu 4: min 0, deduplikasi) ===
  const logSchema = z.object({
    workHours: z.number().int().min(0).max(24),
    income: z.number().int().min(0).nullable().optional(),
    symptoms: z.array(z.string().trim().min(1))
      .transform((items) => Array.from(new Set(items)))
      .optional()
      .default([]),
  });

  const validLog = logSchema.safeParse({
    workHours: 8,
    income: 250000,
    symptoms: ["Sakit Pinggang", "Leher & Bahu"],
  });
  assert(validLog.success === true, "Validasi catatan kerja normal (8 jam, Rp 250.000)");

  const validRestDay = logSchema.safeParse({
    workHours: 0,
    income: 0,
    symptoms: [],
  });
  assert(validRestDay.success === true, "Validasi hari libur (0 jam kerja) diterima");

  const invalidHours = logSchema.safeParse({
    workHours: 30, // Melebihi 24 jam sehari
    income: 200000,
  });
  assert(invalidHours.success === false, "Penolakan jam kerja jika lebih dari 24 jam sehari");

  const negativeIncome = logSchema.safeParse({
    workHours: 8,
    income: -50000, // Negatif
  });
  assert(negativeIncome.success === false, "Penolakan jika pendapatan bernilai negatif");

  // === 6. Uji Deduplikasi Array Keluhan (Minggu 4) ===
  const duplicateSymptoms = logSchema.safeParse({
    workHours: 10,
    income: 300000,
    symptoms: ["Sakit Pinggang", "Mata Lelah", "Sakit Pinggang", "Mata Lelah"],
  });
  assert(
    duplicateSymptoms.success === true &&
    duplicateSymptoms.data.symptoms.length === 2 &&
    duplicateSymptoms.data.symptoms[0] === "Sakit Pinggang" &&
    duplicateSymptoms.data.symptoms[1] === "Mata Lelah",
    "Deduplikasi array keluhan ganda berhasil"
  );

  // === 7. Uji Validasi WorkLog Update (PUT) Zod ===
  const updateLogSchema = z.object({
    workHours: z.number().int().min(0).max(24).optional(),
    income: z.number().int().min(0).nullable().optional(),
    symptoms: z.array(z.string().trim().min(1))
      .transform((items) => Array.from(new Set(items)))
      .optional(),
  });

  const validPartialUpdate = updateLogSchema.safeParse({
    workHours: 10,
  });
  assert(validPartialUpdate.success === true, "Validasi pembaruan parsial (hanya jam kerja)");

  const validZeroUpdate = updateLogSchema.safeParse({
    workHours: 0,
  });
  assert(validZeroUpdate.success === true, "Validasi pembaruan jam kerja 0 (hari libur) diterima");

  const invalidNegativeHours = updateLogSchema.safeParse({
    workHours: -1,
  });
  assert(invalidNegativeHours.success === false, "Penolakan pembaruan jika jam kerja bernilai negatif");

  console.log(`\n=== Hasil Pengujian: ${passedCount}/${totalTests} Uji Berhasil ===`);
  if (passedCount === totalTests) {
    console.log("🎉 Semua logika bisnis dan validasi P1 (Auth, CRUD Logs, Normalisasi, Deduplikasi) berfungsi sempurna!");
  }
}

runTests().catch((err) => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});

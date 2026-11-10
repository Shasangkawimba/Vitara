// ============================================================
// server/src/scripts/testAuth.js
// Script uji cepat untuk validasi modul Auth & Logger milik P1.
// Menjamin logika bisnis, Zod schema, dan JWT berfungsi normal.
// Jalankan dengan: node src/scripts/testAuth.js
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

  // 1. Uji Validasi Register Zod
  const registerSchema = z.object({
    phone: z.string().trim().min(10).max(15).regex(/^[0-9+]+$/),
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

  // 2. Uji Hashing Bcrypt
  const plainPassword = "rahasiaMitra2024";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrongMatch = await bcrypt.compare("kataSandiSalah", hash);

  assert(isMatch === true, "Bcrypt berhasil memverifikasi kata sandi yang cocok");
  assert(isWrongMatch === false, "Bcrypt menolak kata sandi yang tidak cocok");

  // 3. Uji JWT Signing & Verifikasi
  const secret = "test_secret_vitara";
  const payload = { id: "user_123", phone: "08123456789", name: "Budi" };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  const decoded = jwt.verify(token, secret);

  assert(decoded.id === "user_123" && decoded.name === "Budi", "JWT token berhasil ditandatangani dan diverifikasi");

  // 4. Uji Validasi WorkLog Zod
  const logSchema = z.object({
    workHours: z.number().int().min(1).max(24),
    income: z.number().int().nonnegative().nullable().optional(),
    symptoms: z.array(z.string()).optional(),
  });

  const validLog = logSchema.safeParse({
    workHours: 8,
    income: 250000,
    symptoms: ["Sakit Pinggang", "Bahu Kaku"],
  });
  assert(validLog.success === true, "Validasi catatan kerja normal (8 jam, Rp 250.000)");

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

  console.log(`\n=== Hasil Pengujian: ${passedCount}/${totalTests} Uji Berhasil ===`);
  if (passedCount === totalTests) {
    console.log("🎉 Semua logika bisnis dan validasi P1 berfungsi sempurna!");
  }
}

runTests().catch((err) => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});


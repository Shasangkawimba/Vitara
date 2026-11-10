// ============================================================
// server/src/routes/auth.js
// Router API Autentikasi Pengguna (Registrasi, Login, Profil).
// Sesuai dengan kontrak API_CONTRACT.md & standar AGENTS.md.
// Dikelola secara mutlak oleh P1.
// ============================================================
const express = require("express");
const { z } = require("zod");
const authService = require("../services/authService");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * GET /api/auth
 * Info endpoint autentikasi
 */
router.get("/", (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      modul: "Autentikasi VITARA (P1)",
      endpoints: [
        "POST /api/auth/register (Daftar akun baru)",
        "POST /api/auth/login (Masuk & dapatkan JWT)",
        "GET /api/auth/me (Profil pengguna aktif)",
      ],
    },
  });
});

/**
 * GET /api/auth/login
 * Panduan jika user melakukan GET di browser
 */
router.get("/login", (_req, res) => {
  return res.status(405).json({
    success: false,
    error: "Method GET tidak didukung untuk login. Silakan kirimkan request POST dengan body JSON: { phone, password }.",
  });
});

/**
 * GET /api/auth/register
 * Panduan jika user melakukan GET di browser
 */
router.get("/register", (_req, res) => {
  return res.status(405).json({
    success: false,
    error: "Method GET tidak didukung untuk registrasi. Silakan kirimkan request POST dengan body JSON: { phone, password, name, occupation }.",
  });
});

// Skema Validasi Registrasi dengan Zod
const registerSchema = z.object({
  phone: z
    .string({ required_error: "Nomor telepon wajib diisi." })
    .trim()
    .min(10, "Nomor telepon minimal 10 digit.")
    .max(15, "Nomor telepon maksimal 15 digit.")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh berisi angka dan tanda plus."),
  password: z
    .string({ required_error: "Kata sandi wajib diisi." })
    .min(6, "Kata sandi minimal 6 karakter."),
  name: z
    .string({ required_error: "Nama lengkap wajib diisi." })
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(50, "Nama maksimal 50 karakter."),
  occupation: z
    .string()
    .trim()
    .max(50, "Profesi maksimal 50 karakter.")
    .optional(),
});

// Skema Validasi Login dengan Zod
const loginSchema = z.object({
  phone: z
    .string({ required_error: "Nomor telepon wajib diisi." })
    .trim()
    .min(1, "Nomor telepon wajib diisi."),
  password: z
    .string({ required_error: "Kata sandi wajib diisi." })
    .min(1, "Kata sandi wajib diisi."),
});

/**
 * POST /api/auth/register
 * Mendaftarkan akun user baru
 */
router.post("/register", async (req, res) => {
  try {
    // 1. Validasi input dengan Zod
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage = validationResult.error.errors[0]?.message || "Data input tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

    // 2. Jalankan logika bisnis pendaftaran
    const result = await authService.registerUser(validationResult.data);

    // 3. Return respons sukses sesuai API_CONTRACT
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Terjadi kesalahan internal pada server saat registrasi.",
    });
  }
});

/**
 * POST /api/auth/login
 * Login pengguna dan mengembalikan JWT Token
 */
router.post("/login", async (req, res) => {
  try {
    // 1. Validasi input dengan Zod
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage = validationResult.error.errors[0]?.message || "Data input tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

    // 2. Jalankan logika bisnis login
    const result = await authService.loginUser(validationResult.data);

    // 3. Return respons sukses sesuai API_CONTRACT
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Terjadi kesalahan internal pada server saat login.",
    });
  }
});

/**
 * GET /api/auth/me
 * Mengambil profil user yang sedang login menggunakan JWT token
 */
router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = router;


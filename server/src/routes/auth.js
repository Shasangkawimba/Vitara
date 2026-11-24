// ============================================================
// server/src/routes/auth.js
// Router API Autentikasi Pengguna (Registrasi, Login, Profil,
// dan OAuth Google).
// Sesuai dengan kontrak API_CONTRACT.md & standar AGENTS.md.
// Dikelola secara mutlak oleh P1.
// ============================================================
const express = require("express");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("node:crypto");
const { z } = require("zod");
const authService = require("../services/authService");
const oauthService = require("../services/oauthService");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { validasiKataSandi } = require("../constants/password");
const { catatAudit } = require("../services/auditService");
const passwordResetService = require("../services/passwordResetService");
const {
  aturCookieSesi,
  aturCookieCsrf,
  hapusCookieSesi,
  bacaCookie,
  NAMA_SESI,
} = require("../lib/sessionCookies");
const { cabutSesi } = require("../lib/sesiDicabut");

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
        "GET /api/auth/csrf (Ambil token CSRF sebelum request perubahan data)",
        "POST /api/auth/logout (Akhiri sesi)",
        "POST /api/auth/forgot-password (Kirim tautan reset sandi)",
        "POST /api/auth/reset-password (Atur sandi baru dengan token)",
        "GET /api/auth/me (Profil pengguna aktif)",
        "PUT /api/auth/me (Perbarui profil: nama, profesi, telepon, email)",
        "PUT /api/auth/me/photo (Simpan atau hapus foto profil)",
        "PUT /api/auth/me/password (Ganti kata sandi)",
        "DELETE /api/auth/me (Hapus akun permanen)",
        "GET /api/auth/oauth/google/start (Mulai masuk dengan Google)",
        "GET /api/auth/oauth/google/callback (Callback Google)",
        "POST /api/auth/oauth/exchange (Tukar kode sekali pakai jadi JWT)",
      ],
    },
  });
});

/**
 * GET /api/auth/csrf
 * Menyiapkan cookie CSRF yang dibaca frontend sebelum request perubahan data.
 */
router.get("/csrf", (_req, res) => {
  const token = randomBytes(32).toString("hex");
  aturCookieCsrf(res, token);
  res.set("Cache-Control", "no-store");
  return res.status(200).json({ success: true, data: { csrfToken: token } });
});

/**
 * POST /api/auth/logout
 * Menghapus cookie sesi httpOnly dan cookie CSRF.
 */
router.post("/logout", (req, res) => {
  const token = bacaCookie(req, NAMA_SESI);
  const klaim = jwt.decode(token);
  cabutSesi(klaim?.jti, klaim?.exp ? klaim.exp * 1000 : undefined);
  hapusCookieSesi(res);
  return res.status(200).json({
    success: true,
    data: { message: "Sesi berhasil diakhiri." },
  });
});

/**
 * Normalisasi username: trim + huruf kecil.
 * Karakter yang diizinkan (huruf kecil, angka, underscore)
 * divalidasi ketat oleh skema Zod di bawah.
 * @param {string} username - Username mentah
 * @returns {string} Username ternormalisasi
 */
function normalizeUsername(username) {
  return (username || "").trim().toLowerCase();
}

// Skema Validasi Registrasi dengan Zod.
// Nomor telepon opsional: user boleh melengkapinya di halaman Profil.
const registerSchema = z.object({
  username: z
    .string({ required_error: "Username wajib diisi." })
    .trim()
    .transform(normalizeUsername)
    .pipe(
      z.string()
        .min(3, "Username minimal 3 karakter.")
        .max(20, "Username maksimal 20 karakter.")
        .regex(
          /^[a-z0-9_]+$/,
          "Username hanya boleh huruf kecil, angka, dan underscore."
        )
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((nilai) => (nilai ? authService.normalizePhone(nilai) : undefined))
    .pipe(
      z.string()
        .min(10, "Nomor telepon minimal 10 digit.")
        .max(15, "Nomor telepon maksimal 15 digit.")
        .regex(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka.")
        .optional()
    ),
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
}).refine((d) => validasiKataSandi(d.password) === null, {
  path: ["password"],
  message: "Kata sandi minimal 6 karakter, berisi huruf dan angka.",
});

// Skema Validasi Login: username (untuk akun baru) atau phone
// (alias kompatibilitas mundur untuk akun lama yang belum punya username).
const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .transform(normalizeUsername)
      .pipe(z.string().min(1, "Username wajib diisi."))
      .optional(),
    phone: z
      .string()
      .trim()
      .transform(authService.normalizePhone)
      .pipe(z.string().min(1))
      .optional(),
    password: z
      .string({ required_error: "Kata sandi wajib diisi." })
      .min(1, "Kata sandi wajib diisi."),
  })
  .refine((d) => d.username || d.phone, {
    message: "Username wajib diisi.",
  });

// Skema Validasi Perbarui Profil. Semua field opsional; string kosong
// berarti mengosongkan (nomor telepon / email boleh belum diisi).
const teleponOpsional = z
  .union([z.string(), z.null()])
  .optional()
  .transform((nilai) =>
    nilai === undefined || nilai === null
      ? undefined
      : nilai
      ? authService.normalizePhone(nilai)
      : ""
  )
  .pipe(
    z
      .string()
      .refine(
        (nilai) => nilai === "" || /^0\d{9,14}$/.test(nilai),
        "Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx."
      )
      .optional()
  );

const emailOpsional = z
  .union([z.string(), z.null()])
  .optional()
  .transform((nilai) =>
    nilai === undefined || nilai === null
      ? undefined
      : String(nilai).trim().toLowerCase()
  )
  .pipe(
    z
      .string()
      .refine(
        (nilai) => nilai === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai),
        "Format email tidak valid."
      )
      .optional()
  );

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(50, "Nama maksimal 50 karakter.")
    .optional(),
  occupation: z
    .string()
    .trim()
    .max(50, "Profesi maksimal 50 karakter.")
    .optional(),
  phone: teleponOpsional,
  email: emailOpsional,
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
    await catatAudit({ userId: result.user.id, aksi: "DAFTAR", req });
    aturCookieSesi(res, result.token);

    // 3. Return profil; JWT tidak dikirim lagi ke frontend.
    return res.status(201).json({
      success: true,
      data: { user: result.user },
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
    await catatAudit({ userId: result.user.id, aksi: "MASUK", req });
    aturCookieSesi(res, result.token);

    // 3. Return profil; JWT tidak dikirim lagi ke frontend.
    return res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Terjadi kesalahan internal pada server saat login.",
    });
  }
});

const lupaSandiSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi." })
    .trim()
    .toLowerCase()
    .email("Format email tidak valid."),
});

const resetSandiTokenSchema = z
  .object({
    token: z
      .string({ required_error: "Token reset wajib diisi." })
      .min(32, "Token reset tidak valid."),
    password: z
      .string({ required_error: "Kata sandi baru wajib diisi." })
      .min(6, "Kata sandi baru minimal 6 karakter.")
      .max(72, "Kata sandi baru maksimal 72 karakter."),
  })
  .refine((d) => validasiKataSandi(d.password) === null, {
    path: ["password"],
    message: "Kata sandi baru harus berisi huruf dan angka.",
  });

/**
 * POST /api/auth/forgot-password
 * Selalu membalas pesan umum agar keberadaan email tidak bocor.
 */
router.post("/forgot-password", async (req, res) => {
  const validasi = lupaSandiSchema.safeParse(req.body);
  if (!validasi.success) {
    return res.status(400).json({
      success: false,
      error: validasi.error.errors[0]?.message || "Email tidak valid.",
    });
  }

  try {
    await passwordResetService.mintaReset(validasi.data.email);
  } catch (err) {
    console.error("Gagal memproses permintaan reset sandi:", err.message);
  }

  return res.status(200).json({
    success: true,
    data: {
      message: "Jika email terdaftar, tautan reset sudah dikirim.",
    },
  });
});

/**
 * POST /api/auth/reset-password
 * Menukar token sekali pakai dengan kata sandi baru.
 */
router.post("/reset-password", async (req, res) => {
  const validasi = resetSandiTokenSchema.safeParse(req.body);
  if (!validasi.success) {
    return res.status(400).json({
      success: false,
      error: validasi.error.errors[0]?.message || "Data reset tidak valid.",
    });
  }

  try {
    const hasil = await passwordResetService.resetSandi(
      validasi.data.token,
      validasi.data.password
    );
    await catatAudit({ userId: hasil.userId, aksi: "RESET_SANDI", req });
    return res.status(200).json({
      success: true,
      data: { message: "Kata sandi berhasil diperbarui. Silakan masuk kembali." },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal mengatur ulang kata sandi.",
    });
  }
});

/**
 * GET /api/auth/me
 * Mengambil profil user yang sedang login langsung dari database.
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal mengambil profil pengguna.",
    });
  }
});

/**
 * PUT /api/auth/me
 * Memperbarui nama, profesi, nomor telepon, dan email user aktif.
 * Nomor telepon & email boleh dikosongkan lalu diisi kapan saja.
 */
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const validationResult = updateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstErrorMessage = validationResult.error.errors[0]?.message || "Data input tidak valid.";
      return res.status(400).json({
        success: false,
        error: firstErrorMessage,
      });
    }

    const user = await authService.updateProfile(
      req.user.id,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal memperbarui profil pengguna.",
    });
  }
});

/**
 * PUT /api/auth/me/photo
 * Simpan atau hapus foto profil. Body: { photo: dataURL base64 | null }.
 * Batas 200 KB setelah decode agar tetap ringan di database.
 */
const BATAS_FOTO_BYTE = 200 * 1024;
const POLA_FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

router.put("/me/photo", authenticateToken, async (req, res) => {
  const nilai = req.body?.photo;

  if (nilai !== null && typeof nilai !== "string") {
    return res.status(400).json({
      success: false,
      error: "Foto wajib berupa dataURL gambar atau null.",
    });
  }

  let photo = nilai || null;
  if (photo) {
    if (!POLA_FOTO.test(photo)) {
      return res.status(400).json({
        success: false,
        error: "Format foto harus dataURL JPEG, PNG, atau WebP.",
      });
    }
    const base64 = photo.split(",")[1] || "";
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const ukuranByte = Math.floor((base64.length * 3) / 4) - padding;
    if (ukuranByte > BATAS_FOTO_BYTE) {
      return res.status(400).json({
        success: false,
        error: "Ukuran foto maksimal 200 KB.",
      });
    }
  }

  try {
    const user = await authService.updatePhoto(req.user.id, photo);
    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal menyimpan foto profil.",
    });
  }
});

/**
 * PUT /api/auth/me/password
 * Ganti kata sandi. Akun Google boleh membuat kata sandi baru
 * tanpa mengisi currentPassword.
 */
const gantiSandiSchema = z
  .object({
    currentPassword: z.string().max(100, "Kata sandi saat ini terlalu panjang.").optional(),
    password: z
      .string({ required_error: "Kata sandi baru wajib diisi." })
      .min(6, "Kata sandi baru minimal 6 karakter.")
      .max(72, "Kata sandi baru maksimal 72 karakter."),
  })
  .refine((d) => validasiKataSandi(d.password) === null, {
    path: ["password"],
    message: "Kata sandi baru harus berisi huruf dan angka.",
  });

router.put("/me/password", authenticateToken, async (req, res) => {
  const validasi = gantiSandiSchema.safeParse(req.body);
  if (!validasi.success) {
    return res.status(400).json({
      success: false,
      error: validasi.error.errors[0]?.message || "Data kata sandi tidak valid.",
    });
  }

  try {
    await authService.changePassword(req.user.id, validasi.data);
    await catatAudit({ userId: req.user.id, aksi: "GANTI_SANDI", req });
    return res.status(200).json({
      success: true,
      data: { diubah: true },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal mengganti kata sandi.",
    });
  }
});

/**
 * DELETE /api/auth/me
 * Hapus akun user aktif beserta seluruh data terkait (cascade).
 */
router.delete("/me", authenticateToken, async (req, res) => {
  try {
    await catatAudit({ userId: req.user.id, aksi: "HAPUS_AKUN", req });
    const hasil = await authService.deleteAccount(req.user.id);
    hapusCookieSesi(res);
    return res.status(200).json({
      success: true,
      data: { id: hasil.id, message: "Akun berhasil dihapus." },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal menghapus akun.",
    });
  }
});

/**
 * Baca satu cookie dari header (tanpa dependency cookie-parser).
 * @param {import("express").Request} req
 * @param {string} nama
 * @returns {string}
 */
function bacaCookieState(req, nama) {
  const daftar = String(req.headers.cookie || "").split(";");
  for (const bagian of daftar) {
    const [kunci, ...sisa] = bagian.trim().split("=");
    if (kunci === nama) return decodeURIComponent(sisa.join("="));
  }
  return "";
}

const JALUR_COOKIE_STATE = "/api/auth/oauth";

// Cookie state harus Secure di produksi. Selain NODE_ENV, HTTPS pada
// OAUTH_REDIRECT_URI jadi penanda cadangan bila env produksi belum diset.
const COOKIE_SECURE =
  process.env.NODE_ENV === "production" ||
  /^https:/i.test(process.env.OAUTH_REDIRECT_URI || "");

/** Redirect balik ke halaman callback frontend dengan pesan error. */
function gagalKeClient(res, pesan) {
  return res.redirect(
    `${oauthService.CLIENT_URL}/auth/callback?error=${encodeURIComponent(pesan)}`
  );
}

/**
 * GET /api/auth/oauth/google/start
 * Menyimpan state di cookie lalu mengalihkan ke halaman izin Google.
 */
router.get("/oauth/google/start", (req, res) => {
  if (!oauthService.googleSiap()) {
    return res.status(503).json({
      success: false,
      error:
        "Login Google belum dikonfigurasi di server. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env.",
    });
  }

  const { state, nonce } = oauthService.buatState();
  res.cookie("vitara_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    maxAge: 10 * 60 * 1000,
    path: JALUR_COOKIE_STATE,
  });

  return res.redirect(oauthService.urlIzinGoogle(state));
});

/**
 * GET /api/auth/oauth/google/callback
 * Menukar kode Google, login/daftar otomatis, lalu kembali ke frontend
 * dengan kode sekali pakai (bukan JWT mentah di URL).
 */
router.get("/oauth/google/callback", async (req, res) => {
  const nonce = bacaCookieState(req, "vitara_oauth_state");
  res.clearCookie("vitara_oauth_state", { path: JALUR_COOKIE_STATE });

  if (req.query.error) {
    return gagalKeClient(res, "Masuk dengan Google dibatalkan.");
  }

  try {
    oauthService.verifikasiState(String(req.query.state || ""), nonce);
    const accessToken = await oauthService.tukarCode(String(req.query.code || ""));
    const profil = await oauthService.ambilProfilGoogle(accessToken);
    const user = await oauthService.loginAtauDaftarGoogle(profil);
    await catatAudit({ userId: user.id, aksi: "MASUK_GOOGLE", req });
    const kode = oauthService.buatKodeTukar(user.id);

    return res.redirect(
      `${oauthService.CLIENT_URL}/auth/callback?code=${encodeURIComponent(kode)}`
    );
  } catch (err) {
    return gagalKeClient(
      res,
      err.message || "Gagal masuk dengan Google. Silakan coba lagi."
    );
  }
});

/**
 * POST /api/auth/oauth/exchange
 * Menukar kode sekali pakai menjadi JWT sesi + profil user.
 */
router.post("/oauth/exchange", async (req, res) => {
  try {
    const hasil = await oauthService.tukarKode(req.body?.code);
    aturCookieSesi(res, hasil.token);
    return res.status(200).json({
      success: true,
      data: { user: hasil.user },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal menyelesaikan masuk dengan Google.",
    });
  }
});

module.exports = router;

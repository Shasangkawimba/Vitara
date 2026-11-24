// ============================================================
// server/src/services/authService.js
// Logika bisnis autentikasi (Registrasi, Login, Profil Pengguna).
// Dikelola oleh P1 (Auth & Work-Health Logger).
// ============================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("node:crypto");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia_vitara_jwt_super_aman_2024";
const JWT_EXPIRES_IN = "7d"; // Masa berlaku token 7 hari

// Kolom yang aman dikirim ke frontend (tanpa password).
const KOLOM_PUBLIK = {
  id: true,
  username: true,
  phone: true,
  email: true,
  name: true,
  occupation: true,
  photo: true,
  authProvider: true,
  createdAt: true,
};

/**
 * Normalisasi nomor telepon Indonesia ke format standar 08xxx.
 * Mendukung: 08..., +628..., 628..., 8...
 * @param {string} phone - Nomor telepon mentah
 * @returns {string} Nomor telepon ternormalisasi
 */
function normalizePhone(phone) {
  let cleaned = String(phone || "").replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+62")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("62") && cleaned.length >= 11) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("8") && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

/**
 * Buat JWT untuk sesi login (dipakai login lokal maupun Google).
 * @param {Object} user - Baris User dari database
 * @returns {string} JWT
 */
function buatToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      jti: randomBytes(16).toString("hex"),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Ambil data user yang aman dikirim ke frontend.
 * @param {Object} user - Baris User dari database
 * @returns {Object} Profil publik
 */
function userPublik(user) {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    name: user.name,
    occupation: user.occupation,
    photo: user.photo || null,
    authProvider: user.authProvider || "local",
    createdAt: user.createdAt,
  };
}

/**
 * Mendaftarkan pengguna baru ke database.
 * Nomor telepon opsional; user bisa melengkapinya di halaman Profil.
 * @param {Object} data - { username, phone?, password, name, occupation? }
 * @returns {Promise<Object>} { user, token }
 */
async function registerUser({ username, phone, password, name, occupation }) {
  // 1. Cek apakah username sudah dipakai
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    const error = new Error("Username sudah dipakai. Silakan pilih username lain.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Cek nomor telepon hanya bila diisi
  if (phone) {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      const error = new Error("Nomor telepon sudah terdaftar. Silakan gunakan nomor lain atau login.");
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Hash kata sandi dengan bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Simpan pengguna baru ke database
  const newUser = await prisma.user.create({
    data: {
      username,
      phone: phone || null,
      password: hashedPassword,
      name,
      occupation: occupation || "Mitra Pekerja",
    },
    select: KOLOM_PUBLIK,
  });

  return {
    user: newUser,
    token: buatToken(newUser),
  };
}

/**
 * Memvalidasi kredensial pengguna dan mengembalikan JWT token
 * @param {Object} data - { username, phone?, password }
 *   username dipakai sebagai kredensial utama; `phone` tetap
 *   diterima sebagai alias kompatibilitas untuk akun lama.
 * @returns {Promise<Object>} { user, token }
 */
async function loginUser({ username, phone, password }) {
  // 1. Cari pengguna berdasarkan username (akun baru) atau
  //    nomor telepon (kompatibilitas mundur untuk akun lama)
  const user = username
    ? await prisma.user.findUnique({ where: { username } })
    : await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    const error = new Error("Username atau kata sandi tidak valid.");
    error.statusCode = 401;
    throw error;
  }

  // 2. Akun Google belum punya kata sandi: arahkan ke tombol Google.
  if (!user.password) {
    const error = new Error(
      "Akun ini dibuat dengan Google. Silakan masuk lewat tombol Masuk dengan Google."
    );
    error.statusCode = 401;
    throw error;
  }

  // 3. Verifikasi kata sandi
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Username atau kata sandi tidak valid.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: userPublik(user),
    token: buatToken(user),
  };
}

/**
 * Ambil profil terbaru dari database (bukan dari klaim JWT yang bisa usang).
 * @param {string} userId - ID user dari token
 * @returns {Promise<Object>} Profil publik
 */
async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...KOLOM_PUBLIK, password: true },
  });
  if (!user) {
    const error = new Error("Akun tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }
  // hasPassword dipakai UI Profil: akun Google belum punya sandi,
  // jadi kolom "kata sandi saat ini" tidak wajib diisi.
  const { password, ...publik } = user;
  return { ...publik, hasPassword: Boolean(password) };
}

/**
 * Perbarui profil user (nama, profesi, nomor telepon, email).
 * Nomor telepon & email boleh dikosongkan (null) dan diisi belakangan.
 * @param {string} userId - ID user aktif
 * @param {Object} data - { name?, occupation?, phone?, email? }
 * @returns {Promise<Object>} Profil publik terbaru
 */
async function updateProfile(userId, { name, occupation, phone, email }) {
  const data = {};

  if (name !== undefined) data.name = name;
  if (occupation !== undefined) data.occupation = occupation || null;

  if (phone !== undefined) {
    data.phone = phone ? normalizePhone(phone) : null;
    if (data.phone) {
      const dipakai = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (dipakai && dipakai.id !== userId) {
        const error = new Error("Nomor telepon sudah dipakai akun lain.");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  if (email !== undefined) {
    data.email = email ? String(email).trim().toLowerCase() : null;
    if (data.email) {
      const dipakai = await prisma.user.findUnique({ where: { email: data.email } });
      if (dipakai && dipakai.id !== userId) {
        const error = new Error("Email sudah dipakai akun lain.");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: KOLOM_PUBLIK,
    });
    return user;
  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Akun tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
}

/**
 * Simpan atau hapus foto profil (dataURL base64).
 * @param {string} userId - ID user aktif
 * @param {string|null} photo - dataURL gambar, atau null untuk menghapus
 * @returns {Promise<Object>} Profil publik terbaru
 */
async function updatePhoto(userId, photo) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { photo },
      select: KOLOM_PUBLIK,
    });
    return user;
  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Akun tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
}

/**
 * Ganti kata sandi user aktif.
 * Akun Google (belum punya kata sandi) boleh membuat kata sandi baru
 * tanpa mengisi kata sandi saat ini.
 * @param {string} userId - ID user aktif
 * @param {Object} data - { currentPassword?, password }
 * @returns {Promise<{ diubah: boolean }>}
 */
async function changePassword(userId, { currentPassword, password }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    const error = new Error("Akun tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  if (user.password) {
    if (!currentPassword) {
      const error = new Error("Kata sandi saat ini wajib diisi.");
      error.statusCode = 400;
      throw error;
    }
    const cocok = await bcrypt.compare(currentPassword, user.password);
    if (!cocok) {
      const error = new Error("Kata sandi saat ini tidak cocok.");
      error.statusCode = 400;
      throw error;
    }
  }

  const hashBaru = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashBaru },
  });

  return { diubah: true };
}

/**
 * Hapus akun user beserta seluruh data terkait.
 * WorkLog & AiInteraction ikut terhapus lewat onDelete: Cascade.
 * @param {string} userId - ID user aktif
 * @returns {Promise<{ id: string }>}
 */
async function deleteAccount(userId) {
  try {
    await prisma.user.delete({ where: { id: userId } });
    return { id: userId };
  } catch (err) {
    if (err.code === "P2025") {
      const error = new Error("Akun tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
}

module.exports = {
  normalizePhone,
  buatToken,
  userPublik,
  registerUser,
  loginUser,
  getUserById,
  updateProfile,
  updatePhoto,
  changePassword,
  deleteAccount,
};

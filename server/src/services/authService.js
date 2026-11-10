// ============================================================
// server/src/services/authService.js
// Logika bisnis autentikasi (Registrasi & Login Pengguna).
// Dikelola oleh P1 (Auth & Work-Health Logger).
// ============================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia_vitara_jwt_super_aman_2024";
const JWT_EXPIRES_IN = "7d"; // Masa berlaku token 7 hari

/**
 * Mendaftarkan pengguna baru ke database
 * @param {Object} data - { phone, password, name, occupation }
 * @returns {Promise<Object>} { user, token }
 */
async function registerUser({ phone, password, name, occupation }) {
  // 1. Cek apakah nomor telepon sudah terdaftar
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    const error = new Error("Nomor telepon sudah terdaftar. Silakan gunakan nomor lain atau login.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Hash kata sandi dengan bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Simpan pengguna baru ke database
  const newUser = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      name,
      occupation: occupation || "Mitra Pekerja",
    },
    select: {
      id: true,
      phone: true,
      name: true,
      occupation: true,
      createdAt: true,
    },
  });

  // 4. Buat JWT token
  const token = jwt.sign(
    {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      occupation: newUser.occupation,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: newUser,
    token,
  };
}

/**
 * Memvalidasi kredensial pengguna dan mengembalikan JWT token
 * @param {Object} data - { phone, password }
 * @returns {Promise<Object>} { user, token }
 */
async function loginUser({ phone, password }) {
  // 1. Cari pengguna berdasarkan nomor telepon
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    const error = new Error("Nomor telepon atau kata sandi tidak valid.");
    error.statusCode = 401;
    throw error;
  }

  // 2. Verifikasi kata sandi
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Nomor telepon atau kata sandi tidak valid.");
    error.statusCode = 401;
    throw error;
  }

  // 3. Buat JWT token
  const token = jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      name: user.name,
      occupation: user.occupation,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // 4. Return data pengguna (tanpa field password) dan token
  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      occupation: user.occupation,
      createdAt: user.createdAt,
    },
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};


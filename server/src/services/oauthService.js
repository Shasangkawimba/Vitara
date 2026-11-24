// ============================================================
// server/src/services/oauthService.js
// Logika OAuth Google: susun URL izin, tukar kode, ambil profil,
// lalu login/daftar otomatis berdasarkan email Google.
// Tanpa dependency tambahan (memakai fetch bawaan Node 18+).
// ============================================================
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const authService = require("./authService");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia_vitara_jwt_super_aman_2024";
const CLIENT_URL = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const REDIRECT_URI =
  process.env.OAUTH_REDIRECT_URI ||
  "http://localhost:5001/api/auth/oauth/google/callback";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

function galat(pesan, statusCode = 400) {
  const error = new Error(pesan);
  error.statusCode = statusCode;
  return error;
}

/** Apakah kredensial Google sudah diisi di .env */
function googleSiap() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Buat state anti-CSRF: nilai acak di cookie + JWT bertanda tangan.
 * @returns {{ state: string, nonce: string }}
 */
function buatState() {
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = jwt.sign({ nonce, purpose: "oauth-state" }, JWT_SECRET, {
    expiresIn: "10m",
  });
  return { state, nonce };
}

/**
 * Verifikasi state dari Google dan cocokkan dengan cookie browser.
 * @param {string} state - Parameter state dari callback
 * @param {string} nonce - Nilai cookie yang diset saat mulai login
 */
function verifikasiState(state, nonce) {
  if (!state || !nonce) {
    throw galat("Sesi OAuth tidak ditemukan. Silakan ulangi masuk dengan Google.");
  }
  let payload;
  try {
    payload = jwt.verify(state, JWT_SECRET);
  } catch {
    throw galat("Sesi OAuth kedaluwarsa. Silakan ulangi masuk dengan Google.");
  }
  if (payload.purpose !== "oauth-state" || payload.nonce !== nonce) {
    throw galat("Sesi OAuth tidak cocok. Silakan ulangi masuk dengan Google.");
  }
}

/** URL halaman izin Google. */
function urlIzinGoogle(state) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Tukar authorization code menjadi access token Google. */
async function tukarCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw galat("Gagal menukar kode otorisasi Google. Coba lagi.", 502);
  }
  return data.access_token;
}

/** Ambil profil dasar dari Google (sub, email, name). */
async function ambilProfilGoogle(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profil = await res.json().catch(() => ({}));
  if (!res.ok || !profil.sub) {
    throw galat("Gagal mengambil profil Google. Coba lagi.", 502);
  }
  return {
    providerId: String(profil.sub),
    email: String(profil.email || "").trim().toLowerCase(),
    emailVerified: profil.email_verified !== false,
    name: String(profil.name || "").trim(),
  };
}

/**
 * Username dari email, dipotong sesuai aturan (3-20, huruf kecil/angka/underscore)
 * dan diberi akhiran angka bila sudah dipakai.
 * @param {string} email
 * @returns {Promise<string>}
 */
async function usernameUnik(email) {
  const dasar = String(email.split("@")[0] || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  const calon = dasar.length >= 3 ? dasar : `pengguna_${dasar}`.slice(0, 20);

  for (let i = 0; i < 50; i += 1) {
    const akhiran = i === 0 ? "" : `_${i}`;
    const nama = `${calon.slice(0, 20 - akhiran.length)}${akhiran}`;
    const dipakai = await prisma.user.findUnique({ where: { username: nama } });
    if (!dipakai) return nama;
  }
  return `pengguna_${Date.now().toString(36)}`.slice(0, 20);
}

/**
 * Login atau daftar otomatis dari profil Google.
 * Urutan pencocokan: providerId -> email -> akun baru.
 * @param {{ providerId: string, email: string, name: string }} profil
 * @returns {Promise<Object>} Baris User
 */
async function loginAtauDaftarGoogle(profil) {
  const { providerId, email, emailVerified, name } = profil;
  if (!email) {
    throw galat(
      "Akun Google tidak membagikan alamat email. Izinkan akses email lalu coba lagi."
    );
  }
  // Email belum terverifikasi tidak boleh menautkan akun yang sudah ada.
  if (emailVerified === false) {
    throw galat("Email akun Google belum terverifikasi. Verifikasi dulu lalu coba lagi.");
  }

  let user = await prisma.user.findFirst({
    where: { authProvider: "google", providerId },
  });

  // Email yang sudah terdaftar (mis. diisi manual di Profil) ditautkan.
  if (!user) {
    const akunEmail = await prisma.user.findUnique({ where: { email } });
    if (akunEmail) {
      user = await prisma.user.update({
        where: { id: akunEmail.id },
        data: { authProvider: "google", providerId },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        username: await usernameUnik(email),
        authProvider: "google",
        providerId,
      },
    });
  }

  return user;
}

/** Kode sekali pakai (2 menit) untuk ditukar jadi token sesi. */
function buatKodeTukar(userId) {
  return jwt.sign({ id: userId, purpose: "oauth-exchange" }, JWT_SECRET, {
    expiresIn: "2m",
  });
}

/**
 * Tukar kode sekali pakai menjadi sesi login penuh.
 * @param {string} kode
 * @returns {Promise<{ user: Object, token: string }>} token dipakai route untuk cookie sesi
 */
async function tukarKode(kode) {
  let payload;
  try {
    payload = jwt.verify(String(kode || ""), JWT_SECRET);
  } catch {
    throw galat("Kode masuk Google sudah tidak berlaku. Silakan masuk ulang.");
  }
  if (payload.purpose !== "oauth-exchange") {
    throw galat("Kode masuk Google tidak valid.");
  }
  const user = await authService.getUserById(payload.id);
  return { user, token: authService.buatToken(user) };
}

module.exports = {
  CLIENT_URL,
  googleSiap,
  buatState,
  verifikasiState,
  urlIzinGoogle,
  tukarCode,
  ambilProfilGoogle,
  loginAtauDaftarGoogle,
  buatKodeTukar,
  tukarKode,
};

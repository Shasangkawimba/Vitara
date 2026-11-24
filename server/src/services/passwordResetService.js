// ============================================================
// server/src/services/passwordResetService.js
// Reset kata sandi lewat email. Token disimpan sebagai hash,
// berlaku 30 menit, dan hanya bisa dipakai sekali.
// ============================================================
const { createHash, randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const MASA_BERLAKU_MS = 30 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

async function kirimEmailReset(email, tautan) {
  const kunci = process.env.RESEND_API_KEY;
  if (!kunci) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[reset sandi] tautan untuk ${email}: ${tautan}`);
    } else {
      console.warn("RESEND_API_KEY belum diisi, email reset tidak dikirim.");
    }
    return false;
  }

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#163532">
      <h2 style="margin:0 0 12px">Reset kata sandi VITARA</h2>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.</p>
      <p><a href="${tautan}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#163532;color:#ffffff;text-decoration:none">Atur kata sandi baru</a></p>
      <p>Tautan ini berlaku 30 menit dan hanya bisa dipakai sekali.</p>
      <p>Jika Anda tidak meminta reset, abaikan email ini. Kata sandi lama tetap berlaku.</p>
    </div>
  `;

  try {
    const respons = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kunci}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "VITARA <onboarding@resend.dev>",
        to: email,
        subject: "Reset kata sandi VITARA",
        html,
      }),
    });
    if (!respons.ok) {
      console.error("Gagal mengirim email reset:", respons.status, await respons.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Gagal menghubungi layanan email:", err.message);
    return false;
  }
}

/**
 * Buat token reset bila email terdaftar.
 * @param {string} email
 * @returns {Promise<string|null>} userId bila ada, null bila email tidak terdaftar
 */
async function mintaReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + MASA_BERLAKU_MS),
    },
  });

  await kirimEmailReset(email, `${CLIENT_URL}/reset-password?token=${token}`);
  return user.id;
}

/**
 * Pakai token reset untuk mengganti kata sandi.
 * @param {string} token
 * @param {string} password - kata sandi baru yang sudah divalidasi route
 * @returns {Promise<{ userId: string }>}
 */
async function resetSandi(token, password) {
  const catatan = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!catatan || catatan.usedAt || catatan.expiresAt.getTime() < Date.now()) {
    const galat = new Error("Tautan reset tidak valid atau sudah kedaluwarsa.");
    galat.statusCode = 400;
    throw galat;
  }

  const salt = await bcrypt.genSalt(10);
  const hashBaru = await bcrypt.hash(password, salt);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: catatan.userId },
      data: { password: hashBaru },
    }),
    prisma.passwordResetToken.update({
      where: { id: catatan.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: catatan.userId, id: { not: catatan.id } },
    }),
  ]);

  return { userId: catatan.userId };
}

module.exports = { mintaReset, resetSandi };

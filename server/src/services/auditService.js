// ============================================================
// server/src/services/auditService.js
// Jejak aksi sensitif (daftar, masuk, ganti sandi, hapus akun).
// Gagal menulis log tidak boleh menggagalkan aksi utama.
// ============================================================
const prisma = require("../lib/prisma");

async function catatAudit({ userId = null, aksi, detail = null, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        aksi,
        detail,
        ip: req?.ip ? String(req.ip).slice(0, 45) : null,
        userAgent: req?.get
          ? String(req.get("user-agent") || "").slice(0, 255) || null
          : null,
      },
    });
  } catch (err) {
    console.error("Gagal menulis audit log:", err.message);
  }
}

module.exports = { catatAudit };

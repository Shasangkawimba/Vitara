// ============================================================
// server/src/lib/prisma.js
// Instance Prisma Client tunggal untuk seluruh backend VITARA.
// Dikelola oleh P1 (Pemilik Schema & Database).
// ============================================================
const { PrismaClient } = require("@prisma/client");

// Inisialisasi Prisma Client tunggal
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;


// Uji Sprint 7: reset kata sandi lewat email dan health check.
// Jalankan: node src/scripts/testSprint7.js
const assert = require("node:assert/strict");
const { createHash, randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { mintaReset, resetSandi } = require("../services/passwordResetService");

function hash(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  const suffix = Date.now().toString();
  const email = `s7_${suffix}@contoh.id`;
  const user = await prisma.user.create({
    data: {
      username: `s7_${suffix}`,
      email,
      password: await bcrypt.hash("lama123", 10),
      name: "Uji Reset",
    },
  });

  try {
    assert.equal(await mintaReset("tidak-ada@contoh.id"), null, "email asing tidak membuat token");
    assert.equal(await mintaReset(email), user.id, "email terdaftar membuat token");
    assert.equal(
      await prisma.passwordResetToken.count({ where: { userId: user.id } }),
      1,
      "token reset tersimpan sebagai hash"
    );

    // Ganti dengan token yang diketahui agar alur reset bisa diuji.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await resetSandi(token, "baru123");
    const terbaru = await prisma.user.findUnique({ where: { id: user.id } });
    assert.equal(await bcrypt.compare("baru123", terbaru.password), true, "sandi baru tersimpan");
    await assert.rejects(() => resetSandi(token, "lagi123"), /tidak valid|kedaluwarsa/);

    const tokenKedaluwarsa = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash(tokenKedaluwarsa),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await assert.rejects(() => resetSandi(tokenKedaluwarsa, "baru123"), /kedaluwarsa/);

    console.log("Sprint 7 OK: token reset sekali pakai dan kedaluwarsa ditolak.");
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

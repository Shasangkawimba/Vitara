// Uji Sprint 6: helper WIB, langganan push, dan deduplikasi scheduler.
// Jalankan: node src/scripts/testSprint6.js
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const webpush = require("web-push");

// Kunci uji dibuat di sini agar tidak menyimpan kunci asli di repo.
const kunciUji = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC = kunciUji.publicKey;
process.env.VAPID_PRIVATE = kunciUji.privateKey;
process.env.VAPID_SUBJECT = "mailto:uji@vitara.id";

const prisma = require("../lib/prisma");
const pushService = require("../services/pushService");
const { infoWaktu, hariSesuai, periksaSekarang } = require("../services/pushScheduler");

async function main() {
  const contoh = infoWaktu(new Date("2026-11-24T04:30:00Z"));
  assert.deepEqual(contoh, {
    jam: "11:30",
    hari: "Selasa",
    tanggal: "2026-11-24",
  });
  assert.equal(hariSesuai(["Setiap Hari"], "Minggu"), true);
  assert.equal(hariSesuai(["Senin-Jumat"], "Sabtu"), false);
  assert.equal(hariSesuai(["Selasa"], "Selasa"), true);
  assert.equal(pushService.pushSiap(), true);

  const suffix = Date.now().toString();
  const user = await prisma.user.create({
    data: { username: `s6_${suffix}`, name: "Uji Push" },
  });

  try {
    await pushService.simpanSubscription(user.id, {
      endpoint: `http://localhost:5001/palsu/${suffix}`,
      keys: { p256dh: kunciUji.publicKey, auth: randomBytes(16).toString("base64url") },
    });
    assert.equal(
      await prisma.pushSubscription.count({ where: { userId: user.id } }),
      1,
      "langganan push tersimpan per user"
    );

    const pengingat = await prisma.reminder.create({
      data: {
        userId: user.id,
        title: "Uji Push Sprint 6",
        time: infoWaktu(new Date()).jam,
        days: ["Setiap Hari"],
      },
    });

    // Jaringan push diganti stub agar uji tidak mengirim ke endpoint palsu.
    pushService.kirimKeUser = async () => 1;
    await periksaSekarang();
    const pertama = await prisma.reminder.findUnique({ where: { id: pengingat.id } });
    assert.ok(pertama.lastSentAt, "scheduler menandai pengingat terkirim");

    await periksaSekarang();
    const kedua = await prisma.reminder.findUnique({ where: { id: pengingat.id } });
    assert.equal(
      kedua.lastSentAt.toISOString(),
      pertama.lastSentAt.toISOString(),
      "pengingat tidak dikirim dua kali di hari yang sama"
    );

    console.log("Sprint 6 OK: helper WIB, langganan push, dan deduplikasi scheduler.");
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

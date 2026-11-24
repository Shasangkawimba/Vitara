// Uji cepat Sprint 4: reminder per-user & audit log.
// Jalankan: node src/scripts/testSprint4.js
const assert = require("node:assert/strict");
const prisma = require("../lib/prisma");
const reminderService = require("../services/reminderService");
const { catatAudit } = require("../services/auditService");

async function main() {
  const suffix = Date.now().toString();
  const a = await prisma.user.create({
    data: { username: `sprint4a_${suffix}`, name: "Uji A" },
  });
  const b = await prisma.user.create({
    data: { username: `sprint4b_${suffix}`, name: "Uji B" },
  });

  try {
    const reminder = await reminderService.createReminder(
      { title: "Uji reminder", time: "08:30", days: ["Senin"], notes: "tes" },
      a.id
    );
    assert.deepEqual(reminder.days, ["Senin"], "days tersimpan sebagai array");

    const milikA = await reminderService.getAllReminders(a.id);
    const milikB = await reminderService.getAllReminders(b.id);
    assert.equal(milikA.length, 1, "user A melihat reminder sendiri");
    assert.equal(milikB.length, 0, "user B tidak melihat reminder user A");

    assert.equal(
      await reminderService.toggleReminderStatus(reminder.id, b.id),
      null,
      "user B tidak bisa mengubah reminder user A"
    );
    assert.equal(
      await reminderService.deleteReminder(reminder.id, b.id),
      false,
      "user B tidak bisa menghapus reminder user A"
    );

    await catatAudit({ userId: a.id, aksi: "TES_SPRINT4", req: null });
    const audit = await prisma.auditLog.findFirst({
      where: { userId: a.id, aksi: "TES_SPRINT4" },
    });
    assert.ok(audit, "audit log tertulis");

    assert.equal(await reminderService.deleteReminder(reminder.id, a.id), true);
    console.log("Sprint 4 OK: reminder per-user & audit log berhasil diuji.");
  } finally {
    await prisma.reminder.deleteMany({ where: { userId: { in: [a.id, b.id] } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: [a.id, b.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

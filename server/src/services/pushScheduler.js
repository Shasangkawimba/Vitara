// ============================================================
// server/src/services/pushScheduler.js
// Pengirim pengingat dari server agar notifikasi tetap sampai
// walau tab browser pengguna tertutup. Waktu memakai WIB (Asia/Jakarta).
// ============================================================
const prisma = require("../lib/prisma");
const pushService = require("./pushService");

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const KODE_HARI = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function infoWaktu(tanggal = new Date()) {
  const bagian = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(tanggal)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  const jam = (bagian.hour === "24" ? "00" : bagian.hour) + ":" + bagian.minute;
  return {
    jam,
    hari: NAMA_HARI[KODE_HARI.indexOf(bagian.weekday)],
    tanggal: `${bagian.year}-${bagian.month}-${bagian.day}`,
  };
}

function hariSesuai(days, hari) {
  if (!Array.isArray(days)) return false;
  return (
    days.includes("Setiap Hari") ||
    days.includes(hari) ||
    (days.includes("Senin-Jumat") && !["Sabtu", "Minggu"].includes(hari))
  );
}

async function periksaSekarang() {
  if (!pushService.pushSiap()) return;
  const { jam, hari, tanggal } = infoWaktu();

  const daftar = await prisma.reminder.findMany({
    where: {
      isActive: true,
      time: jam,
      user: { pushSubscriptions: { some: {} } },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      notes: true,
      days: true,
      lastSentAt: true,
    },
  });

  for (const pengingat of daftar) {
    if (!hariSesuai(pengingat.days, hari)) continue;
    if (
      pengingat.lastSentAt &&
      infoWaktu(pengingat.lastSentAt).tanggal === tanggal
    ) {
      continue;
    }

    await pushService.kirimKeUser(pengingat.userId, {
      title: `VITARA: ${pengingat.title}`,
      body: pengingat.notes || "Waktunya rehat sejenak dan jaga kesehatan tubuh.",
      url: "/reminder",
      tag: `reminder-${pengingat.id}-${tanggal}`,
    });
    await prisma.reminder.update({
      where: { id: pengingat.id },
      data: { lastSentAt: new Date() },
    });
  }
}

function startPushScheduler() {
  if (!pushService.pushSiap()) return () => {};
  const timer = setInterval(() => {
    periksaSekarang().catch((err) =>
      console.error("Gagal memeriksa jadwal Web Push:", err.message)
    );
  }, 30_000);
  periksaSekarang().catch(() => {});
  return () => clearInterval(timer);
}

module.exports = { infoWaktu, hariSesuai, periksaSekarang, startPushScheduler };

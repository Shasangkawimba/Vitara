// ============================================================
// server/src/services/pushService.js
// Kirim Web Push ke perangkat pengguna yang sudah berlangganan.
// ============================================================
const webpush = require("web-push");
const prisma = require("../lib/prisma");

const KUNCI_PUBLIK = process.env.VAPID_PUBLIC || "";
const KUNCI_PRIVAT = process.env.VAPID_PRIVATE || "";
const SUBJEK = process.env.VAPID_SUBJECT || "mailto:admin@vitara.id";

let siap = false;
if (KUNCI_PUBLIK && KUNCI_PRIVAT) {
  webpush.setVapidDetails(SUBJEK, KUNCI_PUBLIK, KUNCI_PRIVAT);
  siap = true;
}

function pushSiap() {
  return siap;
}

function kunciPublik() {
  return KUNCI_PUBLIK;
}

async function simpanSubscription(userId, subscription) {
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    const galat = new Error("Data langganan push tidak lengkap.");
    galat.statusCode = 400;
    throw galat;
  }

  return prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  });
}

async function kirimKeUser(userId, payload) {
  if (!siap) return 0;
  const daftar = await prisma.pushSubscription.findMany({ where: { userId } });
  let terkirim = 0;

  for (const langganan of daftar) {
    try {
      await webpush.sendNotification(
        {
          endpoint: langganan.endpoint,
          keys: { p256dh: langganan.p256dh, auth: langganan.auth },
        },
        JSON.stringify(payload)
      );
      terkirim += 1;
    } catch (err) {
      // 404/410 berarti perangkat sudah tidak terlangganan.
      if ([404, 410].includes(err.statusCode)) {
        await prisma.pushSubscription
          .delete({ where: { id: langganan.id } })
          .catch(() => {});
      } else {
        console.error("Gagal mengirim Web Push:", err.message);
      }
    }
  }

  return terkirim;
}

module.exports = { pushSiap, kunciPublik, simpanSubscription, kirimKeUser };

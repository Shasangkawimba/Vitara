// Service Worker VITARA untuk Web Push.
// Tidak menyimpan cache offline, hanya meneruskan notifikasi ke pengguna.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const judul = payload.title || "VITARA";
  const opsi = {
    body: payload.body || "Ada pengingat kesehatan untuk Anda.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "vitara-reminder",
    data: { url: payload.url || "/reminder" },
  };

  event.waitUntil(self.registration.showNotification(judul, opsi));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tujuan = event.notification.data?.url || "/reminder";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if (new URL(klien.url).origin === self.location.origin) {
          klien.navigate(tujuan);
          return klien.focus();
        }
      }
      return self.clients.openWindow(tujuan);
    })
  );
});

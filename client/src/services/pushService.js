// ============================================================
// client/src/services/pushService.js
// Registrasi Service Worker dan langganan Web Push VITARA.
// ============================================================
import api from "./api";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const mentah = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(mentah, (karakter) => karakter.charCodeAt(0));
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export async function aktifkanPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    registerServiceWorker();
    const registrasi = await navigator.serviceWorker.ready;
    const respons = await api.get("/api/push/public-key");
    const kunciPublik = respons.data?.data?.publicKey;
    if (!kunciPublik) return false;

    let langganan = await registrasi.pushManager.getSubscription();
    if (!langganan) {
      langganan = await registrasi.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(kunciPublik),
      });
    }

    await api.post("/api/push/subscribe", { subscription: langganan.toJSON() });
    return true;
  } catch (err) {
    console.error("Gagal mengaktifkan Web Push:", err);
    return false;
  }
}

// ============================================================
// client/src/hooks/useDarkMode.js
// Hook kecil untuk membaca status Dark Mode secara reaktif.
// Navbar mengelola tema lewat class "dark" di <html>; hook ini
// mengamatinya via MutationObserver sehingga komponen (mis. grafik
// Recharts yang warnanya di-set via prop, bukan class Tailwind)
// bisa menyesuaikan warna tanpa re-render manual.
// ============================================================
import { useSyncExternalStore } from "react";

function subscribe(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function useDarkMode() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default useDarkMode;

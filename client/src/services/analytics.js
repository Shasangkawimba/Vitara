// ============================================================
// client/src/services/analytics.js
// Memuat GTM/GA4 hanya bila ID diset di environment, dan mengirim
// event konversi. Tanpa ID, semua fungsi sengaja no-op.
// ============================================================

export function initAnalytics() {
  if (typeof window === "undefined" || window.__vitaraAnalytics) return;
  window.__vitaraAnalytics = true;
  window.dataLayer = window.dataLayer || [];

  const gtmId = import.meta.env.VITE_GTM_ID;
  if (gtmId) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const skrip = document.createElement("script");
    skrip.async = true;
    skrip.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(skrip);
    return;
  }

  const gaId = import.meta.env.VITE_GA4_ID;
  if (!gaId) return;

  const skrip = document.createElement("script");
  skrip.async = true;
  skrip.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(skrip);

  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
}

export function trackEvent(nama, properti = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", nama, properti);
    return;
  }

  const dataLayer = window.dataLayer;
  if (!Array.isArray(dataLayer)) return;
  dataLayer.push({ event: nama, ...properti });
}

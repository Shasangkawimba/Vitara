// ============================================================
// server/src/lib/sessionCookies.js
// Pengelola cookie sesi httpOnly dan cookie CSRF untuk VITARA.
// ============================================================
const NAMA_SESI = "vitara_session";
const NAMA_CSRF = "vitara_csrf";
const MASA_SESI = 7 * 24 * 60 * 60 * 1000;

// Ikuti penanda produksi yang sudah dipakai alur OAuth.
const AMAN =
  process.env.NODE_ENV === "production" ||
  /^https:/i.test(process.env.OAUTH_REDIRECT_URI || "");

function bacaCookie(req, nama) {
  const daftar = String(req.headers.cookie || "").split(";");
  for (const bagian of daftar) {
    const [kunci, ...sisa] = bagian.trim().split("=");
    if (kunci === nama) return decodeURIComponent(sisa.join("="));
  }
  return "";
}

function aturCookieSesi(res, token) {
  res.cookie(NAMA_SESI, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: AMAN,
    path: "/api",
    maxAge: MASA_SESI,
  });
}

// Cookie CSRF harus bisa dibaca JS, jadi path-nya "/" bukan "/api".
function aturCookieCsrf(res, token) {
  res.cookie(NAMA_CSRF, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: AMAN,
    path: "/",
    maxAge: MASA_SESI,
  });
}

function hapusCookieSesi(res) {
  res.clearCookie(NAMA_SESI, {
    httpOnly: true,
    sameSite: "lax",
    secure: AMAN,
    path: "/api",
  });
  res.clearCookie(NAMA_CSRF, {
    httpOnly: false,
    sameSite: "lax",
    secure: AMAN,
    path: "/",
  });
}

module.exports = {
  NAMA_SESI,
  NAMA_CSRF,
  bacaCookie,
  aturCookieSesi,
  aturCookieCsrf,
  hapusCookieSesi,
};

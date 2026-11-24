// ============================================================
// server/src/middlewares/csrfMiddleware.js
// Double-submit CSRF: header X-CSRF-Token harus sama dengan cookie
// vitara_csrf. Cookie CSRF tidak httpOnly agar bisa dibaca frontend.
// ============================================================
const { timingSafeEqual } = require("node:crypto");
const { bacaCookie, NAMA_CSRF } = require("../lib/sessionCookies");

const METODE_AMAN = new Set(["GET", "HEAD", "OPTIONS"]);

function validasiCsrf(req, res, next) {
  if (METODE_AMAN.has(req.method)) return next();

  const dariCookie = Buffer.from(String(bacaCookie(req, NAMA_CSRF)));
  const dariHeader = Buffer.from(String(req.get("x-csrf-token") || ""));

  if (
    dariCookie.length === 0 ||
    dariCookie.length !== dariHeader.length ||
    !timingSafeEqual(dariCookie, dariHeader)
  ) {
    return res.status(403).json({
      success: false,
      error: "Token keamanan tidak valid. Muat ulang halaman lalu coba lagi.",
    });
  }

  return next();
}

module.exports = { validasiCsrf };

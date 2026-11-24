// ============================================================
// server/src/middlewares/authMiddleware.js
// Middleware autentikasi JWT dari cookie sesi httpOnly.
// Dikelola oleh P1 (Auth).
// ============================================================
const jwt = require("jsonwebtoken");
const { bacaCookie, NAMA_SESI } = require("../lib/sessionCookies");
const { sesiDicabut } = require("../lib/sesiDicabut");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia_vitara_jwt_super_aman_2024";

/**
 * Middleware autentikasi JWT
 * Membaca JWT dari cookie vitara_session yang dikirim browser otomatis.
 */
function authenticateToken(req, res, next) {
  const token = bacaCookie(req, NAMA_SESI);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Akses ditolak. Sesi login tidak ditemukan. Silakan masuk kembali.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (sesiDicabut(decoded.jti)) {
      return res.status(401).json({
        success: false,
        error: "Sesi sudah berakhir. Silakan masuk kembali.",
      });
    }
    req.user = decoded; // { id, username, name, jti }
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    });
  }
}

module.exports = {
  authenticateToken,
};

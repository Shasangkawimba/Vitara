// ============================================================
// server/src/middlewares/authMiddleware.js
// Middleware untuk memverifikasi JWT token pada endpoint terproteksi.
// Dikelola oleh P1 (Auth).
// ============================================================
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia_vitara_jwt_super_aman_2024";

/**
 * Middleware autentikasi JWT
 * Memastikan request membawa Bearer Token yang valid di header Authorization.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Akses ditolak. Token autentikasi tidak ditemukan.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, phone, name, occupation }
    next();
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


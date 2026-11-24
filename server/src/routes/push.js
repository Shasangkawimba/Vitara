// ============================================================
// server/src/routes/push.js
// Langganan Web Push VITARA (milik P4).
// ============================================================
const express = require("express");
const { z } = require("zod");
const { authenticateToken } = require("../middlewares/authMiddleware");
const pushService = require("../services/pushService");

const router = express.Router();

const skemaLangganan = z.object({
  subscription: z.object({
    endpoint: z.string().url("Endpoint langganan tidak valid."),
    keys: z.object({
      p256dh: z.string().min(1, "Kunci p256dh wajib diisi."),
      auth: z.string().min(1, "Kunci auth wajib diisi."),
    }),
  }),
});

/**
 * GET /api/push/public-key
 * Kunci publik VAPID untuk PushManager.subscribe di browser.
 */
router.get("/public-key", (_req, res) => {
  return res.status(200).json({
    success: true,
    data: { publicKey: pushService.kunciPublik() },
  });
});

/**
 * POST /api/push/subscribe
 * Simpan langganan push per perangkat untuk user yang sedang login.
 */
router.post("/subscribe", authenticateToken, async (req, res) => {
  const validasi = skemaLangganan.safeParse(req.body);
  if (!validasi.success) {
    return res.status(400).json({
      success: false,
      error: validasi.error.issues[0]?.message || "Data langganan tidak valid.",
    });
  }

  try {
    const langganan = await pushService.simpanSubscription(
      req.user.id,
      validasi.data.subscription
    );
    return res.status(201).json({
      success: true,
      data: {
        id: langganan.id,
        endpoint: langganan.endpoint,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal menyimpan langganan notifikasi.",
    });
  }
});

module.exports = router;

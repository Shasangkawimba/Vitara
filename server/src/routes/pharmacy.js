const express = require('express');
const router = express.Router();
const { fetchNearbyPharmacies } = require('../services/pharmacyService');

/**
 * GET /api/pharmacy?lat=&lng=&radius=
 * Proxy Overpass API untuk mencari apotek terdekat berdasarkan lokasi pengguna.
 * Sesuai kontrak API_CONTRACT.md.
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validasi parameter lat dan lng
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Parameter lat dan lng wajib diisi.',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = radius ? parseInt(radius, 10) : 3000;

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        error: 'Format koordinat lat atau lng tidak valid.',
      });
    }

    if (isNaN(searchRadius) || searchRadius <= 0 || searchRadius > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Radius pencarian harus berupa angka antara 1 hingga 10000 meter.',
      });
    }

    const mulai = Date.now();
    const pharmacies = await fetchNearbyPharmacies(latitude, longitude, searchRadius);
    let hasil = pharmacies;
    let radiusTerpakai = searchRadius;

    // OSM di sebagian daerah hanya punya sedikit apotek dalam 3 km. Bila hasil
    // sedikit dan permintaan pertama cepat, perluas ke 10 km agar daftar tidak
    // kosong. Ambang waktu menjaga total respons tetap di bawah timeout client.
    const RADIUS_MAKS = 10000;
    if (hasil.length < 5 && searchRadius < RADIUS_MAKS && Date.now() - mulai < 2500) {
      const lebihLuas = await fetchNearbyPharmacies(
        latitude,
        longitude,
        RADIUS_MAKS
      );
      if (lebihLuas.length > hasil.length) {
        hasil = lebihLuas;
        radiusTerpakai = RADIUS_MAKS;
      }
    }

    return res.json({
      success: true,
      data: hasil,
      meta: { radius: radiusTerpakai },
    });
  } catch (error) {
    console.error('Error pada router /api/pharmacy:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat memproses data apotek terdekat.',
    });
  }
});

module.exports = router;

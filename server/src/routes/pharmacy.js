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

    const pharmacies = await fetchNearbyPharmacies(latitude, longitude, searchRadius);

    return res.json({
      success: true,
      data: pharmacies,
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

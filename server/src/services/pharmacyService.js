/**
 * Layanan Pencarian Apotek Terdekat (Pharmacy Service)
 * Menggunakan Overpass API (OpenStreetMap) untuk mencari apotek dalam radius tertentu.
 */

// Menghitung jarak antara dua koordinat geografis menggunakan rumus Haversine (hasil dalam meter)
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Mengambil data apotek terdekat dari Overpass API berdasarkan koordinat lintang (lat) dan bujur (lng).
 * 
 * @param {number} lat - Lintang pengguna
 * @param {number} lng - Bujur pengguna
 * @param {number} [radius=3000] - Radius pencarian dalam meter (default 3km)
 * @returns {Promise<Array>} List apotek terdekat yang sudah diformat
 */
async function fetchNearbyPharmacies(lat, lng, radius = 3000) {
  // Query Overpass QL mencari node dan way dengan tag amenity=pharmacy di sekitar koordinat
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Gagal menghubungi Overpass API: HTTP ${response.status}`);
    }

    const json = await response.json();
    const elements = json.elements || [];

    // Format data apotek menjadi struktur yang bersih untuk frontend
    const pharmacies = elements.map((item) => {
      const itemLat = item.lat || (item.center && item.center.lat);
      const itemLng = item.lon || (item.center && item.center.lon);
      const tags = item.tags || {};

      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const city = tags['addr:city'] || '';
      const addressParts = [street, housenumber, city].filter(Boolean);

      const distance = itemLat && itemLng
        ? calculateDistanceInMeters(lat, lng, itemLat, itemLng)
        : null;

      return {
        id: item.id,
        name: tags.name || 'Apotek (Tanpa Nama)',
        lat: itemLat,
        lng: itemLng,
        distance, // Jarak dalam meter
        address: addressParts.length > 0 ? addressParts.join(' ') : (tags['addr:full'] || 'Alamat tidak tersedia'),
        opening_hours: tags.opening_hours || 'Informasi jam buka tidak tersedia',
        phone: tags.phone || tags['contact:phone'] || null,
        wheelchair: tags.wheelchair || null,
      };
    });

    // Urutkan apotek dari yang terdekat
    pharmacies.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return pharmacies;
  } catch (error) {
    console.error('Kesalahan saat mengambil data apotek dari Overpass:', error.message);
    throw error;
  }
}

module.exports = {
  fetchNearbyPharmacies,
  calculateDistanceInMeters,
};

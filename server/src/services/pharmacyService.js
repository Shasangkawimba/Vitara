/**
 * Layanan Pencarian Apotek Terdekat (Pharmacy Service)
 * Menggunakan Overpass API (OpenStreetMap) untuk mencari apotek dalam radius tertentu.
 *
 * CATATAN KONEKTIVITAS: beberapa jaringan (ISP/kampus) memblokir atau gagal
 * menjangkau sebagian server Overpass (ConnectTimeoutError). Oleh karena itu
 * pencarian dilakukan BERURUTAN pada daftar endpoint publik — endpoint pertama
 * yang sukses dipakai. Hasil juga di-cache singkat agar tidak membebani mirror.
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

// Daftar endpoint Overpass publik (dicoba berurutan; pertama yang sukses dipakai)
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Batas waktu per percobaan endpoint (ms) — jangan terlalu panjang agar
// fallback cepat berpindah ke mirror berikutnya (dan tidak melebihi timeout axios 15s di client).
const TIMEOUT_PERCUBAAN_MS = 6000;

// Endpoint Photon (geocoder OpenStreetMap global) — fallback terakhir.
// CATATAN: beberapa jaringan hanya bisa menjangkau mirror Overpass yang datanya
// terbatas (mis. overpass.osm.ch hanya memuat data Swiss), sehingga query untuk
// lokasi Indonesia bisa menghasilkan 0 apotek. Photon mengindeks data OSM global
// dan terbukti dapat dijangkau, sehingga dipakai sebagai sumber data cadangan.
const PHOTON_URL = "https://photon.komoot.io/api";
const TIMEOUT_PHOTON_MS = 10000;

// Cache respons sederhana: kunci = "lat,lng,radius" dibulatkan, nilai = { data, waktu }
const cacheOverpass = new Map();
const CACHE_TTL_MS = 60_000; // 1 menit

/**
 * Mengirim query ke Overpass dengan fallback multi-endpoint.
 * @param {string} query - Query Overpass QL
 * @returns {Promise<Object>} JSON hasil Overpass
 */
async function fetchOverpassDenganFallback(query) {
  let kesalahanTerakhir = null;

  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        // Batas waktu tegas per endpoint agar fallback tidak menggantung
        signal: AbortSignal.timeout(TIMEOUT_PERCUBAAN_MS),
      });

      if (!response.ok) {
        throw new Error(`Gagal menghubungi Overpass API: HTTP ${response.status}`);
      }

      const teks = await response.text();
      // Mirror kadang membalas halaman HTML error (bukan JSON) — validasi eksplisit
      let json;
      try {
        json = JSON.parse(teks);
      } catch {
        throw new Error("Respons Overpass bukan JSON (kemungkinan error sementara mirror)");
      }
      // Dispatcher Overpass kadang mengembalikan JSON berisi "remark" error runtime
      if (json.remark && !json.elements) {
        throw new Error(`Overpass remark: ${json.remark}`);
      }
      console.log(`[pharmacyService] Sukses via endpoint: ${url}`);
      return json;
    } catch (err) {
      kesalahanTerakhir = err;
      console.warn(`[pharmacyService] Endpoint gagal (${url}): ${err.message}`);
    }
  }

  throw new Error(
    `Semua endpoint Overpass gagal dijangkau. Percobaan terakhir: ${kesalahanTerakhir?.message || "tidak diketahui"}`
  );
}

/**
 * Fallback: mencari apotek lewat Photon (geocoder OSM global).
 * Photon tidak mendukung query radius eksak seperti Overpass, jadi kita
 * mengambil hasil terdekat (dengan bias lokasi) lalu memfilter jarak di sini.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - Radius filter dalam meter
 * @returns {Promise<Array>} List apotek terdekat yang sudah diformat
 */
async function fetchPharmaciesDariPhoton(lat, lng, radius) {
  const params = new URLSearchParams({
    q: "apotek",
    lat: String(lat),
    lon: String(lng),
    osm_tag: "amenity:pharmacy",
    limit: "100",
  });

  const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
    headers: { "User-Agent": "VITARA/1.0 (aplikasi kesehatan pekerja)" },
    signal: AbortSignal.timeout(TIMEOUT_PHOTON_MS),
  });

  if (!response.ok) {
    throw new Error(`Gagal menghubungi Photon: HTTP ${response.status}`);
  }

  const json = await response.json();
  const features = json.features || [];

  const pharmacies = features
    .map((f) => {
      const [fLng, fLat] = f.geometry?.coordinates || [];
      const p = f.properties || {};
      const alamat = [
        p.street,
        p.housenumber,
        p.district,
        p.city,
        p.postcode,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: `${p.osm_type || "n"}-${p.osm_id || f.properties?.osm_id || Math.random()}`,
        name: p.name || "Apotek (Tanpa Nama)",
        lat: fLat,
        lng: fLng,
        distance: fLat && fLng ? calculateDistanceInMeters(lat, lng, fLat, fLng) : null,
        address: alamat || "Alamat tidak tersedia",
        opening_hours: "Informasi jam buka tidak tersedia",
        phone: null,
        wheelchair: p.wheelchair || null,
      };
    })
    .filter((a) => a.lat && a.lng && a.distance !== null && a.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  return pharmacies;
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
  // Cache singkat: kunci dibulatkan 3 desimal (~110 m) agar hit-nya masuk akal
  const kunciCache = `${lat.toFixed(3)},${lng.toFixed(3)},${radius}`;
  const entriCache = cacheOverpass.get(kunciCache);
  if (entriCache && Date.now() - entriCache.waktu < CACHE_TTL_MS) {
    return entriCache.data;
  }

  // Query Overpass QL mencari node dan way dengan tag amenity=pharmacy di sekitar koordinat
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  let pharmacies;
  try {
    const json = await fetchOverpassDenganFallback(query);
    const elements = json.elements || [];

    // Format data apotek menjadi struktur yang bersih untuk frontend
    pharmacies = elements.map((item) => {
      const itemLat = item.lat || (item.center && item.center.lat);
      const itemLng = item.lon || (item.center && item.center.lon);
      const tags = item.tags || {};

      const street = tags["addr:street"] || "";
      const housenumber = tags["addr:housenumber"] || "";
      const city = tags["addr:city"] || "";
      const addressParts = [street, housenumber, city].filter(Boolean);

      const distance =
        itemLat && itemLng ? calculateDistanceInMeters(lat, lng, itemLat, itemLng) : null;

      return {
        id: item.id,
        name: tags.name || "Apotek (Tanpa Nama)",
        lat: itemLat,
        lng: itemLng,
        distance, // Jarak dalam meter
        address:
          addressParts.length > 0
            ? addressParts.join(" ")
            : tags["addr:full"] || "Alamat tidak tersedia",
        opening_hours: tags.opening_hours || "Informasi jam buka tidak tersedia",
        phone: tags.phone || tags["contact:phone"] || null,
        wheelchair: tags.wheelchair || null,
      };
    });

    // Urutkan apotek dari yang terdekat
    pharmacies.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  } catch (err) {
    console.warn(`[pharmacyService] Overpass tidak tersedia, mencoba Photon: ${err.message}`);
    pharmacies = [];
  }

  // Fallback ke Photon bila Overpass gagal dijangkau ATAU hasilnya kosong
  // (beberapa mirror Overpass hanya memuat data wilayah tertentu, mis. Swiss).
  if (pharmacies.length === 0) {
    try {
      const hasilPhoton = await fetchPharmaciesDariPhoton(lat, lng, radius);
      if (hasilPhoton.length > 0) {
        console.log(`[pharmacyService] Fallback Photon: ${hasilPhoton.length} apotek ditemukan`);
        cacheOverpass.set(kunciCache, { data: hasilPhoton, waktu: Date.now() });
        return hasilPhoton;
      }
    } catch (err) {
      console.warn(`[pharmacyService] Fallback Photon juga gagal: ${err.message}`);
    }
  }

  cacheOverpass.set(kunciCache, { data: pharmacies, waktu: Date.now() });
  return pharmacies;
}

module.exports = {
  fetchNearbyPharmacies,
  calculateDistanceInMeters,
};

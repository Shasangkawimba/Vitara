/**
 * Layanan Pencarian Apotek Terdekat (Pharmacy Service)
 *
 * SUMBER DATA (semua berbasis OpenStreetMap, bukan data rekaan):
 *   1. Overpass API lewat beberapa mirror publik (paling lengkap).
 *   2. Nominatim search dengan viewbox beradius (cadangan bila Overpass gagal).
 *   3. Photon geocoder dengan beberapa kata kunci (cadangan terakhir).
 *
 * Catatan penting: kebanyakan mirror Overpass menolak POST atau hanya memuat
 * data regional (mis. overpass.osm.ch hanya Swiss). Karena itu request memakai
 * GET + daftar mirror yang sudah diverifikasi, dan ketiga sumber digabung
 * lalu deduplikasi agar apotek yang lebih dekat tidak terlewat.
 */

// Jarak Haversine dalam meter.
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Diurutkan berdasarkan ketersediaan & kecepatan yang terukur dari Indonesia.
// Mirror .fr paling sering merespons; sisanya cadangan bila IP server diblokir.
const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const HEADER_OSM = {
  "User-Agent": "VITARA/1.0 (pencari fasilitas kesehatan pekerja)",
  Accept: "application/json",
};

const TIMEOUT_OVERPASS_MS = 7000;
const TIMEOUT_NOMINATIM_MS = 12000;
const TIMEOUT_PHOTON_MS = 12000;

// Photon mewajibkan q, jadi dipakai satu huruf paling umum di nama apotek.
// Filter osm_tag tetap menjamin hasilnya hanya amenity=pharmacy.
const KATA_PHOTON = "a";

const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Ambil JSON Overpass dari mirror pertama yang merespons dengan data valid. */
async function fetchOverpassDenganFallback(query) {
  let kesalahanTerakhir = null;
  const mulai = Date.now();

  for (const url of OVERPASS_ENDPOINTS) {
    // Total waktu Overpass dibatasi agar fallback lain tetap sempat merespons
    // sebelum timeout axios di client (15 detik).
    const sisa = 11000 - (Date.now() - mulai);
    if (sisa <= 1000) break;
    try {
      // GET lebih bisa dijangkau daripada POST di beberapa jaringan/proxy.
      const response = await fetch(
        `${url}?data=${encodeURIComponent(query)}`,
        {
          headers: HEADER_OSM,
          signal: AbortSignal.timeout(Math.min(TIMEOUT_OVERPASS_MS, sisa)),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.remark && !json.elements) throw new Error(json.remark);
      console.log(`[pharmacyService] Overpass sukses via ${url}`);
      return json.elements || [];
    } catch (err) {
      kesalahanTerakhir = err;
      console.warn(`[pharmacyService] Overpass gagal (${url}): ${err.message}`);
    }
  }

  console.warn(
    `[pharmacyService] Semua Overpass gagal: ${kesalahanTerakhir?.message || "tidak diketahui"}`
  );
  return [];
}

/** Format elemen Overpass (node/way) ke struktur yang dipakai frontend. */
function formatOverpass(elements, lat, lng) {
  return elements.map((item) => {
    const itemLat = item.lat || item.center?.lat;
    const itemLng = item.lon || item.center?.lon;
    const tags = item.tags || {};
    const alamat = [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:city"],
    ].filter(Boolean).join(" ");

    return {
      id: `o-${item.id}`,
      name: tags.name || "Apotek (Tanpa Nama)",
      lat: itemLat,
      lng: itemLng,
      distance:
        itemLat && itemLng
          ? calculateDistanceInMeters(lat, lng, itemLat, itemLng)
          : null,
      address: alamat || tags["addr:full"] || "Alamat tidak tersedia",
      opening_hours: tags.opening_hours || "Informasi jam buka tidak tersedia",
      phone: tags.phone || tags["contact:phone"] || null,
      wheelchair: tags.wheelchair || null,
    };
  });
}

/** Nominatim: pencarian pharmacy dibatasi kotak di sekitar koordinat. */
async function fetchDariNominatim(lat, lng, radius) {
  const deltaLat = radius / 111320;
  const deltaLng = radius / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const viewbox = `${lng - deltaLng},${lat + deltaLat},${lng + deltaLng},${lat - deltaLat}`;

  // Query terstruktur amenity=pharmacy: menangkap semua apotek, termasuk yang
  // namanya tidak mengandung kata "apotek" (Kimia Farma, Century, K24, dll).
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      format: "jsonv2",
      amenity: "pharmacy",
      viewbox,
      bounded: "1",
      limit: "50",
      addressdetails: "1",
      extratags: "1",
    });

  const response = await fetch(url, {
    headers: HEADER_OSM,
    signal: AbortSignal.timeout(TIMEOUT_NOMINATIM_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rows = await response.json();

  return rows
    .filter((x) => x.category === "amenity" && x.type === "pharmacy")
    .map((x) => {
      const itemLat = Number(x.lat);
      const itemLng = Number(x.lon);
      const a = x.address || {};
      const extra = x.extratags || {};
      const alamat = [a.road, a.housenumber, a.suburb, a.city].filter(Boolean).join(" ");
      return {
        id: `n-${x.osm_type}-${x.osm_id}`,
        name: x.name || "Apotek (Tanpa Nama)",
        lat: itemLat,
        lng: itemLng,
        distance: calculateDistanceInMeters(lat, lng, itemLat, itemLng),
        address: alamat || x.display_name || "Alamat tidak tersedia",
        opening_hours:
          extra.opening_hours || "Informasi jam buka tidak tersedia",
        phone: extra.phone || a.phone || null,
        wheelchair: extra.wheelchair || null,
      };
    });
}

/** Photon: cadangan terakhir, tetap difilter amenity=pharmacy. */
async function fetchDariPhoton(lat, lng) {
  const params = new URLSearchParams({
    q: KATA_PHOTON,
    osm_tag: "amenity:pharmacy",
    lat: String(lat),
    lon: String(lng),
    limit: "100",
  });
  const response = await fetch(`https://photon.komoot.io/api?${params}`, {
    headers: HEADER_OSM,
    signal: AbortSignal.timeout(TIMEOUT_PHOTON_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const fitur = json.features || [];

  return fitur.map((f) => {
    const [itemLng, itemLat] = f.geometry?.coordinates || [];
    const p = f.properties || {};
    const alamat = [p.street, p.housenumber, p.district, p.city]
      .filter(Boolean)
      .join(" ");
    return {
      id: `p-${p.osm_type || "n"}-${p.osm_id || Math.random().toString(36).slice(2)}`,
      name: p.name || "Apotek (Tanpa Nama)",
      lat: itemLat,
      lng: itemLng,
      distance:
        itemLat && itemLng
          ? calculateDistanceInMeters(lat, lng, itemLat, itemLng)
          : null,
      address: alamat || "Alamat tidak tersedia",
      opening_hours: "Informasi jam buka tidak tersedia",
      phone: null,
      wheelchair: p.wheelchair || null,
    };
  });
}

/** Gabungkan sumber, lengkapi field kosong, buang duplikat, urutkan dari terdekat. */
function gabungkanHasil(sumberList, radius) {
  const peta = new Map();

  for (const sumber of sumberList) {
    for (const apotek of sumber) {
      if (!apotek.lat || !apotek.lng) continue;
      if (apotek.distance === null || apotek.distance > radius) continue;
      // ~11 meter: cukup untuk menyatukan POI yang sama antar-sumber.
      const kunci = `${apotek.lat.toFixed(4)},${apotek.lng.toFixed(4)}`;
      const ada = peta.get(kunci);
      if (!ada) {
        peta.set(kunci, { ...apotek });
        continue;
      }

      // Sumber pertama (Overpass) menang, tapi field yang kosong diisi dari
      // sumber lain supaya alamat, jam buka, dan telepon tidak hilang.
      if (!ada.phone && apotek.phone) ada.phone = apotek.phone;
      if (!ada.wheelchair && apotek.wheelchair) ada.wheelchair = apotek.wheelchair;
      if (
        ada.address === "Alamat tidak tersedia" &&
        apotek.address &&
        apotek.address !== "Alamat tidak tersedia"
      ) {
        ada.address = apotek.address;
      }
      if (
        ada.opening_hours === "Informasi jam buka tidak tersedia" &&
        apotek.opening_hours &&
        apotek.opening_hours !== "Informasi jam buka tidak tersedia"
      ) {
        ada.opening_hours = apotek.opening_hours;
      }
      if (
        (!ada.name || ada.name === "Apotek (Tanpa Nama)") &&
        apotek.name &&
        apotek.name !== "Apotek (Tanpa Nama)"
      ) {
        ada.name = apotek.name;
      }
    }
  }

  return [...peta.values()].sort((a, b) => a.distance - b.distance);
}

/**
 * Ambil seluruh apotek di sekitar koordinat.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radius=3000] meter
 * @returns {Promise<Array>} Apotek terurut dari yang terdekat
 */
async function fetchNearbyPharmacies(lat, lng, radius = 3000) {
  const kunciCache = `${lat.toFixed(3)},${lng.toFixed(3)},${radius}`;
  const entri = cache.get(kunciCache);
  if (entri && Date.now() - entri.waktu < CACHE_TTL_MS) return entri.data;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius},${lat},${lng});
      relation["amenity"="pharmacy"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  // Ketiga sumber dijalankan paralel supaya total waktu tetap di bawah timeout client.
  const [overpass, nominatim, photon] = await Promise.all([
    fetchOverpassDenganFallback(query)
      .then((elements) => formatOverpass(elements, lat, lng))
      .catch((err) => {
        console.warn(`[pharmacyService] Overpass error: ${err.message}`);
        return [];
      }),
    fetchDariNominatim(lat, lng, radius).catch((err) => {
      console.warn(`[pharmacyService] Nominatim error: ${err.message}`);
      return [];
    }),
    fetchDariPhoton(lat, lng).catch((err) => {
      console.warn(`[pharmacyService] Photon error: ${err.message}`);
      return [];
    }),
  ]);

  // Overpass didahulukan karena datanya paling lengkap & punya jam buka.
  const hasil = gabungkanHasil([overpass, nominatim, photon], radius);
  if (hasil.length > 0) {
    cache.set(kunciCache, { data: hasil, waktu: Date.now() });
  }
  console.log(
    `[pharmacyService] ${hasil.length} apotek (overpass=${overpass.length}, nominatim=${nominatim.length}, photon=${photon.length})`
  );
  return hasil;
}

module.exports = {
  fetchNearbyPharmacies,
  calculateDistanceInMeters,
  gabungkanHasil,
};

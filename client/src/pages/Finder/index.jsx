// ============================================================
// client/src/pages/Finder/index.jsx
// Halaman Finder Fasilitas Kesehatan & Apotek VITARA (Milik P4)
// Menggunakan React-Leaflet + OpenStreetMap dan Overpass API Proxy
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import api from "../../services/api";

// Lokasi default (Pusat Jakarta / Monas) jika GPS belum diizinkan
const DEFAULT_CENTER = [-6.175392, 106.827153];
const SEARCH_RADIUS_METERS = 3000; // Radius 3 km sesuai PRD & P4_private.md

// Custom Ikon Marker menggunakan L.divIcon (bebas dari isu path asset bundler)
const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; background-color: #059669; opacity: 0.35; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 16px; height: 16px; background-color: #059669; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const pharmacyIcon = L.divIcon({
  className: "custom-pharmacy-marker",
  html: `
    <div style="width: 32px; height: 32px; background-color: #ffffff; border: 2px solid #10b981; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); font-size: 16px; cursor: pointer;">
      💊
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Helper component untuk mengatur ulang sudut pandang peta saat posisi berubah
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function FinderPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const markerRefs = useRef({});

  // Deteksi lokasi pengguna via Geolocation API saat halaman pertama kali dibuka
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setGpsLoading(true);
    setErrorMessage("");

    if (!("geolocation" in navigator)) {
      setErrorMessage("Perangkat Anda tidak mendukung fitur lokasi (Geolocation). Menampilkan lokasi default.");
      setGpsLoading(false);
      loadPharmacies(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setGpsLoading(false);
        loadPharmacies(latitude, longitude);
      },
      (error) => {
        console.warn("Gagal mendapatkan lokasi GPS:", error.message);
        setErrorMessage(
          "Izin lokasi tidak diberikan atau GPS tidak aktif. Menggunakan lokasi default (Jakarta)."
        );
        setUserLocation(DEFAULT_CENTER);
        setMapCenter(DEFAULT_CENTER);
        setGpsLoading(false);
        loadPharmacies(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Memanggil API backend proxy Overpass
  const loadPharmacies = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pharmacy?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS_METERS}`);
      if (response.data && response.data.success) {
        setPharmacies(response.data.data || []);
      } else {
        setErrorMessage("Tidak ada apotek yang ditemukan di sekitar radius 3 km.");
      }
    } catch (err) {
      console.error("Gagal mengambil data apotek:", err);
      setErrorMessage("Gagal mengambil data apotek dari server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  // Fokuskan peta ke apotek yang dipilih dari list
  const handleSelectPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    if (pharmacy.lat && pharmacy.lng) {
      setMapCenter([pharmacy.lat, pharmacy.lng]);
      const marker = markerRefs.current[pharmacy.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Buka rute Google Maps / Petunjuk Arah eksternal
  const handleOpenDirections = (lat, lng, name) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
      name
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filter pencarian apotek lokal berdasarkan nama atau alamat
  const filteredPharmacies = pharmacies.filter((p) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const addrMatch = p.address?.toLowerCase().includes(query);
    return nameMatch || addrMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Halaman */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <h1 className="text-2xl font-bold text-slate-800">Finder Faskes & Apotek</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Temukan apotek dan fasilitas kesehatan terdekat dalam radius 3 km dari lokasi Anda untuk kebutuhan darurat.
            </p>
          </div>

          <button
            type="button"
            onClick={getUserLocation}
            disabled={gpsLoading || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${gpsLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {gpsLoading ? "Mencari Lokasi..." : "Deteksi Lokasi Saya"}
          </button>
        </div>

        {/* Alert Error / Informasi Lokasi */}
        {errorMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-amber-700 font-bold hover:text-amber-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Grid Konten: Peta & Daftar Apotek */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri/Atas: Peta Leaflet */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[520px] sm:h-[600px] relative">
            {/* Status Bar Peta */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Radius Pantau: <strong>3.000 Meter (3 km)</strong>
              </span>
              <span>
                Total Terdeteksi: <strong>{pharmacies.length} Apotek</strong>
              </span>
            </div>

            {/* Container Peta Leaflet */}
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ minHeight: "100%" }}
              >
                <ChangeMapView coords={mapCenter} />

                {/* Tile Layer OpenStreetMap */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker Posisi Pengguna */}
                {userLocation && (
                  <>
                    <Marker position={userLocation} icon={userIcon}>
                      <Popup>
                        <div className="p-1 text-center">
                          <strong className="text-emerald-700 block text-sm">📍 Lokasi Anda</strong>
                          <span className="text-xs text-slate-500">Pusat pencarian radius 3 km</span>
                        </div>
                      </Popup>
                    </Marker>
                    {/* Lingkaran Radius 3km */}
                    <Circle
                      center={userLocation}
                      radius={SEARCH_RADIUS_METERS}
                      pathOptions={{
                        color: "#059669",
                        fillColor: "#10b981",
                        fillOpacity: 0.08,
                        weight: 1.5,
                        dashArray: "4, 6",
                      }}
                    />
                  </>
                )}

                {/* Marker Seluruh Apotek */}
                {pharmacies.map((pharmacy) => {
                  if (!pharmacy.lat || !pharmacy.lng) return null;
                  return (
                    <Marker
                      key={pharmacy.id}
                      position={[pharmacy.lat, pharmacy.lng]}
                      icon={pharmacyIcon}
                      ref={(el) => {
                        if (el) markerRefs.current[pharmacy.id] = el;
                      }}
                    >
                      <Popup>
                        <div className="p-2 space-y-2 max-w-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">💊</span>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{pharmacy.name}</h4>
                              <p className="text-xs text-slate-600 mt-0.5">{pharmacy.address}</p>
                            </div>
                          </div>

                          {pharmacy.distance !== null && (
                            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block">
                              Jarak: ± {pharmacy.distance >= 1000 ? `${(pharmacy.distance / 1000).toFixed(1)} km` : `${pharmacy.distance} m`}
                            </div>
                          )}

                          {pharmacy.opening_hours && (
                            <p className="text-[11px] text-slate-500">
                              🕒 {pharmacy.opening_hours}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDirections(pharmacy.lat, pharmacy.lng, pharmacy.name)}
                            className="w-full mt-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium text-center transition flex items-center justify-center gap-1.5"
                          >
                            <span>Petunjuk Arah</span>
                            <span>↗</span>
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Kolom Kanan: Daftar Apotek & Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[520px] sm:h-[600px]">
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>🏪</span> Apotek Terdekat
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {filteredPharmacies.length} Lokasi
                </span>
              </div>

              {/* Input Pencarian Cepat */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari apotek atau jalan..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* List Daftar Apotek */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-2 space-y-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs">Mencari apotek terdekat via Overpass...</p>
                </div>
              ) : filteredPharmacies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12 text-center">
                  <span className="text-3xl">🏥</span>
                  <p className="text-xs font-medium text-slate-600">Tidak ada apotek ditemukan</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Coba ganti kata kunci pencarian atau segarkan posisi GPS Anda.
                  </p>
                </div>
              ) : (
                filteredPharmacies.map((pharmacy) => {
                  const isSelected = selectedPharmacy?.id === pharmacy.id;
                  const distLabel =
                    pharmacy.distance !== null
                      ? pharmacy.distance >= 1000
                        ? `${(pharmacy.distance / 1000).toFixed(1)} km`
                        : `${pharmacy.distance} m`
                      : "-";

                  return (
                    <div
                      key={pharmacy.id}
                      onClick={() => handleSelectPharmacy(pharmacy)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 border border-emerald-300"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {pharmacy.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {distLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {pharmacy.address}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                        <span className="text-[10px] text-slate-400">
                          {pharmacy.phone ? `📞 ${pharmacy.phone}` : "OpenStreetMap"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDirections(pharmacy.lat, pharmacy.lng, pharmacy.name);
                          }}
                          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>Rute</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

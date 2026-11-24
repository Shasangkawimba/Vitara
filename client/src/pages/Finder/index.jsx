// ============================================================
// client/src/pages/Finder/index.jsx
// Pencari Faskes & Apotek VITARA (Milik P4).
// Tata letak mengikuti layar Stitch "Faskes & Apotek Siaga":
//   • Mobile: pencarian → peta → kartu detail apotek terpilih
//   • Desktop: kolom detail + daftar di kiri, peta besar di kanan
// Logika lama dipertahankan: Geolocation API, proxy Overpass
// (/api/pharmacy), Leaflet + OpenStreetMap, dan rute eksternal.
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import Skeleton from "../../components/Skeleton";

// Lokasi default (Pusat Jakarta / Monas) jika GPS belum diizinkan
const DEFAULT_CENTER = [-6.175392, 106.827153];
const SEARCH_RADIUS_METERS = 3000; // Radius 3 km sesuai PRD & P4_private.md

// Ikon marker buatan sendiri (bebas dari isu path asset bundler)
const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 26px; height: 26px; background-color: #183b38; opacity: 0.18; border-radius: 9999px;"></div>
      <div style="width: 14px; height: 14px; background-color: #183b38; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

const pharmacyIcon = L.divIcon({
  className: "custom-pharmacy-marker",
  html: `
    <div style="width: 30px; height: 30px; background-color: #183b38; border: 2px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.18); cursor: pointer;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Helper component untuk mengatur ulang sudut pandang peta saat posisi berubah
function ChangeMapView({ coords, radius }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      // Radius lebih luas butuh zoom lebih jauh agar lingkaran tetap terlihat.
      const zoom = radius >= 10000 ? 12 : radius >= 5000 ? 13 : 14;
      map.flyTo(coords, zoom, { duration: 1.5 });
    }
  }, [coords, radius, map]);
  return null;
}

/** Format jarak meter menjadi label ringkas. */
const formatJarak = (meter) => {
  if (meter === null || meter === undefined) return "—";
  return meter >= 1000 ? `${(meter / 1000).toFixed(1)} km` : `${meter} m`;
};

/** Estimasi waktu tempuh motor (± 22 km/jam di lalu lintas kota). */
const estimasiMenit = (meter) => {
  if (meter === null || meter === undefined) return null;
  return Math.max(1, Math.round(meter / 22 / 16.667));
};

const FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "buka24", label: "Buka 24 Jam" },
  { id: "dekat", label: "Di bawah 1 km" },
];

export default function FinderPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [pharmacies, setPharmacies] = useState([]);
  const [radiusAktif, setRadiusAktif] = useState(SEARCH_RADIUS_METERS);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAktif, setFilterAktif] = useState("semua");
  const markerRefs = useRef({});

  // Deteksi lokasi pengguna via Geolocation API saat halaman pertama kali dibuka
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setGpsLoading(true);
    setErrorMessage("");

    if (!("geolocation" in navigator)) {
      setErrorMessage(
        "Perangkat Anda tidak mendukung fitur lokasi (Geolocation). Menampilkan lokasi default."
      );
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
      const response = await api.get(
        `/api/pharmacy?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS_METERS}`
      );
      if (response.data && response.data.success) {
        setPharmacies(response.data.data || []);
        setRadiusAktif(response.data.meta?.radius || SEARCH_RADIUS_METERS);
      } else {
        setErrorMessage("Tidak ada apotek yang ditemukan di sekitar lokasi Anda.");
      }
    } catch (err) {
      console.error("Gagal mengambil data apotek:", err);
      setErrorMessage("Gagal mengambil data apotek dari server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  // Segarkan data memakai posisi terakhir yang diketahui
  const refreshData = () => {
    if (gpsLoading || loading) return;
    const pusat = userLocation || DEFAULT_CENTER;
    loadPharmacies(pusat[0], pusat[1]);
  };

  // Fokuskan peta ke apotek yang dipilih dari daftar
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

  // Filter pencarian + chip kategori (memakai data nyata dari OSM)
  const filteredPharmacies = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return pharmacies.filter((p) => {
      const nama = (p.name || "").toLowerCase();
      const alamat = (p.address || "").toLowerCase();
      const cocokKata = !query || nama.includes(query) || alamat.includes(query);

      let cocokFilter = true;
      if (filterAktif === "buka24") {
        cocokFilter = /24/.test(String(p.opening_hours || ""));
      } else if (filterAktif === "dekat") {
        cocokFilter = p.distance !== null && p.distance !== undefined && p.distance <= 1000;
      }

      return cocokKata && cocokFilter;
    });
  }, [pharmacies, searchQuery, filterAktif]);

  // Kartu detail menampilkan apotek terpilih (bila masih lolos filter),
  // atau yang terdekat sebagai default.
  const detail =
    (selectedPharmacy
      ? filteredPharmacies.find((p) => p.id === selectedPharmacy.id)
      : null) ||
    filteredPharmacies[0] ||
    null;

  const labelRadius = `${Math.round(radiusAktif / 1000)} km`;

  return (
    <div className="w-full">
      {/* Kepala halaman + pencarian */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-4 pt-6 text-white lg:px-12 lg:pt-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Apotek &amp; klinik terdekat
            </span>
            <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-white lg:text-[32px]">
              Faskes &amp; Apotek
            </h1>
            <p className="mt-1 max-w-lg text-sm text-white/70 font-body">
              Jaringan apotek dalam radius {labelRadius} dari posisi Anda, terhubung
              langsung ke peta OpenStreetMap.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60">
                <span className="material-symbols-outlined text-[19px]">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari apotek atau jalan..."
                className="w-full rounded-full border border-white/20 bg-white/10 py-2.5 pl-10 pr-9 text-[13px] font-medium text-white placeholder:font-normal placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
                  aria-label="Hapus pencarian"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={getUserLocation}
              disabled={gpsLoading || loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {gpsLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              )}
              {gpsLoading ? "Mencari lokasi…" : "Lokasi saya"}
            </button>
          </div>
        </div>

        {/* Chip kategori */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterAktif(f.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs transition-colors ${
                filterAktif === f.id
                  ? "bg-primary font-semibold text-white shadow-xs"
                  : "border border-white/20 bg-white/10 font-medium text-white hover:bg-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto hidden shrink-0 text-[11px] font-medium text-white/60 sm:block">
            {filteredPharmacies.length} dari {pharmacies.length} apotek
          </span>
        </div>

        {/* Peringatan lokasi / data */}
        {errorMessage && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined mt-px text-[18px] text-amber-700">
                warning
              </span>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="shrink-0 text-amber-700 transition-colors hover:text-amber-900"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[17px]">close</span>
            </button>
          </div>
        )}
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 pb-14 lg:px-12">
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-5">
          {/* PETA — tampil lebih dulu di mobile */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="map-tint relative isolate z-0 h-[360px] overflow-hidden rounded-4xl border border-border-subtle bg-surface-container shadow-card sm:h-[440px] lg:h-full lg:min-h-[540px]">
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom
                className="h-full w-full"
                style={{ minHeight: "100%" }}
              >
                <ChangeMapView coords={mapCenter} radius={radiusAktif} />

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                  <>
                    <Marker position={userLocation} icon={userIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong className="block text-sm text-text-primary">
                            Lokasi Anda
                          </strong>
                          <span className="text-xs text-text-muted">
                            Pusat pencarian radius {labelRadius}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={userLocation}
                      radius={radiusAktif}
                      pathOptions={{
                        color: "#183b38",
                        fillColor: "#54a195",
                        fillOpacity: 0.08,
                        weight: 1,
                        dashArray: "4, 6",
                      }}
                    />
                  </>
                )}

                {filteredPharmacies.map((pharmacy) => {
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
                        <div className="max-w-xs space-y-2">
                          <h4 className="text-sm font-bold text-text-primary">
                            {pharmacy.name}
                          </h4>
                          <p className="text-xs leading-relaxed text-text-muted">
                            {pharmacy.address}
                          </p>

                          {pharmacy.distance !== null && (
                            <p className="text-[11px] font-semibold text-text-primary">
                              ± {formatJarak(pharmacy.distance)} dari lokasi Anda
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDirections(
                                pharmacy.lat,
                                pharmacy.lng,
                                pharmacy.name
                              )
                            }
                            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              directions
                            </span>
                            Petunjuk arah
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Kontrol peta mengambang */}
              <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={getUserLocation}
                  disabled={gpsLoading}
                  aria-label="Arahkan ke lokasi saya"
                  title="Arahkan ke lokasi saya"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-white/95 text-primary shadow-card backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">my_location</span>
                </button>
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={loading}
                  aria-label="Muat ulang data apotek"
                  title="Muat ulang data apotek"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-white/95 text-primary shadow-card backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>

              {/* Status GPS nyata */}
              <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-full border border-border-subtle bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-text-primary shadow-card backdrop-blur-sm">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    gpsLoading ? "bg-amber-500" : "bg-accent-mint"
                  }`}
                />
                {gpsLoading
                  ? "Mendeteksi GPS…"
                  : userLocation
                  ? `GPS aktif · radius ${labelRadius}`
                  : "Lokasi default (Jakarta)"}
              </div>
            </div>
          </div>

          {/* KOLOM DETAIL + DAFTAR */}
          <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-5">
            {/* Kartu apotek terpilih */}
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              ) : detail ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {detail.opening_hours &&
                        /24/.test(String(detail.opening_hours)) && (
                          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            <span className="material-symbols-outlined text-[13px]">
                              schedule
                            </span>
                            Buka 24 Jam
                          </span>
                        )}
                      <h2 className="text-lg font-bold leading-snug tracking-tight text-text-primary lg:text-xl">
                        {detail.name}
                      </h2>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-border-subtle bg-surface-subtle px-3 py-1 text-[11px] font-semibold text-text-primary">
                      {formatJarak(detail.distance)}
                      {estimasiMenit(detail.distance) !== null
                        ? ` · ${estimasiMenit(detail.distance)} mnt motor`
                        : ""}
                    </span>
                  </div>

                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-text-muted">
                    <span className="material-symbols-outlined mt-px shrink-0 text-[16px]">
                      location_on
                    </span>
                    <span>{detail.address}</span>
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/70 p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-card text-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        medication
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Jam operasional &amp; kontak
                      </p>
                      <p className="mt-0.5 text-xs font-medium leading-relaxed text-text-primary">
                        {detail.opening_hours || "Informasi jam buka tidak tersedia"}
                        {detail.phone ? ` · ${detail.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDirections(detail.lat, detail.lng, detail.name)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        navigation
                      </span>
                      Petunjuk Rute
                    </button>
                    {detail.phone ? (
                      <a
                        href={`tel:${detail.phone}`}
                        aria-label="Telepon apotek"
                        title="Telepon apotek"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-text-primary transition-colors hover:border-primary hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[19px]">call</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label="Nomor telepon tidak tersedia"
                        title="Nomor telepon tidak tersedia"
                        className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border-subtle bg-surface-subtle text-text-muted opacity-60"
                      >
                        <span className="material-symbols-outlined text-[19px]">call</span>
                      </button>
                    )}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${detail.lat}&mlon=${detail.lng}#map=17/${detail.lat}/${detail.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Lihat detail di OpenStreetMap"
                      title="Lihat detail di OpenStreetMap"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-text-primary transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[19px]">map</span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-[34px] text-text-muted">
                    local_pharmacy
                  </span>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    Belum ada apotek terdeteksi
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-text-muted">
                    Aktifkan izin lokasi lalu muat ulang data untuk mencari apotek
                    dalam radius {labelRadius}.
                  </p>
                  <button
                    type="button"
                    onClick={refreshData}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    <span className="material-symbols-outlined text-[17px]">refresh</span>
                    Muat ulang
                  </button>
                </div>
              )}
            </section>

            {/* Daftar apotek terdekat */}
            <section className="flex min-h-0 flex-1 flex-col rounded-4xl border border-border-subtle bg-surface-card p-4 shadow-card lg:p-5">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-bold tracking-tight text-text-primary">
                  Apotek terdekat
                </h3>
                <span className="text-[11px] text-text-muted">
                  {filteredPharmacies.length} lokasi
                </span>
              </div>

              <div className="flex max-h-[420px] flex-1 flex-col gap-2 overflow-y-auto pr-0.5 lg:max-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-text-muted">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs">Mencari apotek terdekat…</p>
                  </div>
                ) : filteredPharmacies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                    <span className="material-symbols-outlined text-[30px] text-text-muted">
                      search_off
                    </span>
                    <p className="text-xs font-semibold text-text-primary">
                      Tidak ada apotek yang cocok
                    </p>
                    <p className="max-w-xs text-[11px] leading-relaxed text-text-muted">
                      Ubah kata kunci pencarian atau pilih filter lain.
                    </p>
                  </div>
                ) : (
                  filteredPharmacies.map((pharmacy) => {
                    const aktif = detail?.id === pharmacy.id;
                    return (
                      <button
                        key={pharmacy.id}
                        type="button"
                        onClick={() => handleSelectPharmacy(pharmacy)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                          aktif
                            ? "border-primary/25 bg-surface-subtle"
                            : "border-border-subtle bg-surface-card hover:border-primary/30 hover:bg-surface-subtle/70"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                            aktif
                              ? "border-primary bg-primary text-white"
                              : "border-border-subtle bg-surface-subtle text-primary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            local_pharmacy
                          </span>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-text-primary">
                            {pharmacy.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                            {pharmacy.address}
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block text-[11px] font-semibold text-text-primary">
                            {formatJarak(pharmacy.distance)}
                          </span>
                          <span className="block text-[10px] text-text-muted">
                            {estimasiMenit(pharmacy.distance) !== null
                              ? `${estimasiMenit(pharmacy.distance)} mnt`
                              : "—"}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-subtle px-1 pt-3 text-[11px] text-text-muted">
                <span>Data: OpenStreetMap / Overpass</span>
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={loading}
                  className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary-dark disabled:opacity-60"
                >
                  Segarkan
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

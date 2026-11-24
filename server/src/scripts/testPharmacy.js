// Uji penggabungan hasil apotek: deduplikasi, pengisian field kosong,
// filter radius, dan nama tanpa kata "apotek" tetap dipertahankan.
// Jalankan: node src/scripts/testPharmacy.js
const assert = require("node:assert/strict");
const { gabungkanHasil } = require("../services/pharmacyService");

const dasar = {
  name: "Century",
  lat: -6.1754,
  lng: 106.8271,
  distance: 100,
  address: "Alamat tidak tersedia",
  opening_hours: "Informasi jam buka tidak tersedia",
  phone: null,
  wheelchair: null,
};

// Sumber pertama (Overpass) minim data, sumber kedua melengkapi.
const overpass = { ...dasar, id: "o-1" };
const nominatim = {
  ...dasar,
  id: "n-1",
  address: "Jalan Uji No. 1",
  opening_hours: "24/7",
  phone: "+6221000000",
  wheelchair: "yes",
};

const hasil = gabungkanHasil([[overpass], [nominatim]], 3000);
assert.equal(hasil.length, 1, "POI yang sama tidak diduplikasi");
assert.equal(hasil[0].address, "Jalan Uji No. 1", "alamat kosong diisi");
assert.equal(hasil[0].opening_hours, "24/7", "jam buka kosong diisi");
assert.equal(hasil[0].phone, "+6221000000", "telepon kosong diisi");
assert.equal(hasil[0].wheelchair, "yes", "akses kursi roda diisi");
assert.equal(hasil[0].name, "Century", "nama tanpa kata apotek dipertahankan");

// Di luar radius dibuang, sisanya urut dari terdekat.
const jauh = {
  ...dasar,
  id: "o-2",
  name: "Kimia Farma",
  lat: -6.19,
  lng: 106.84,
  distance: 5000,
};
assert.equal(gabungkanHasil([[jauh]], 3000).length, 0, "di luar radius dibuang");

const urut = gabungkanHasil([[jauh], [overpass]], 10000);
assert.deepEqual(
  urut.map((x) => x.id),
  ["o-1", "o-2"],
  "hasil urut dari terdekat"
);

// Nama "Apotek (Tanpa Nama)" diganti bila sumber lain punya nama asli.
const tanpaNama = gabungkanHasil(
  [[{ ...dasar, id: "o-3", name: "Apotek (Tanpa Nama)" }], [{ ...nominatim, id: "n-3", name: "Guardian" }]],
  3000
);
assert.equal(tanpaNama[0].name, "Guardian", "nama asli menggantikan placeholder");

console.log("Pharmacy OK: dedupe, isi field kosong, filter radius, nama non-apotek.");

# API Contract — VITARA

Kontrak ini disepakati bersama. Jika butuh data dari P lain, gunakan endpoint ini.

## Format Standar
Sukses: `{ "success": true, "data": { ... } }`
Error: `{ "success": false, "error": "Pesan" }`

## 1. Auth & Logs (Pemilik: P1)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar user baru |
| POST | `/api/auth/login` | Login, return JWT |
| GET | `/api/logs` | List log milik user |
| POST | `/api/logs` | Buat log baru |
| POST | `/api/logs/quick-log` | Duplikasi log terakhir |

Detail body Auth (Minggu 5: username sebagai kredensial utama):

- **POST `/api/auth/register`** — body: `{ name, username, phone, occupation?, password }`.
  `username`: wajib, 3–20 karakter, hanya huruf kecil/angka/underscore (otomatis lowercase), unik per akun (case-insensitive).
  `phone`: dinormalisasi ke format `08xxx`. Respons `{ success, data: { user, token } }` — `user` kini mencakup `username`.
  Username ganda → 400 `"Username sudah dipakai. Silakan pilih username lain."`
- **POST `/api/auth/login`** — body: `{ username, password }` (username menjadi kredensial utama).
  Untuk kompatibilitas mundur, akun lama tanpa username masih bisa masuk dengan `{ phone, password }`.
  Kegagalan → 401 `"Username atau kata sandi tidak valid."`
- **GET `/api/auth/me`** — mengembalikan klaim JWT aktif; akun yang login sejak Minggu 5 menyertakan `username`.

## 2. AI Engine (Pemilik: P2)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/ai/coach` | Kirim teks keluhan, dapat JSON respons |
| GET | `/api/ai/risk-score` | Skor risiko harian (0-100) |
| GET | `/api/ai/weekly-insight` | Ringkasan mingguan |
| GET | `/api/ai/history` | 30 interaksi konsultasi terakhir milik user (urut kronologis, terlama → terbaru) |

Detail respons (Minggu 2-4, semuanya `{ success: true, data: {...} }`):

- **POST `/api/ai/coach`** — body: `{ pesan: string (3-1000 karakter) }` (alias `message`/`keluhan` diterima).
  `data`: `{ analisis, rencana_pemulihan: [{judul, detail}], saran_otc: [{nama, detail}], peringatan, disclaimer, isEmergency, mode, modeLabel, logCount, interaksiId, tersimpan }`.
  Keyword darurat ("nyeri dada", "sesak napas", "pingsan") → `isEmergency: true`, tidak memanggil LLM.
- **GET `/api/ai/risk-score`** (deterministik, tanpa LLM) — `data`:
  `{ skor: number|null, level: "Risiko Tinggi"|"Risiko Sedang"|"Risiko Rendah"|null, kepercayaan: "tinggi"|"sedang"|"rendah"|null, mode, modeLabel, jumlahLog, komponen: [{nama, poin, maks, bobot, detail}], saran, periode, disclaimer }`.
  Ambang level (sinkron widget Dashboard P3): skor >= 70 Tinggi, >= 40 Sedang. `skor: null` saat belum ada log.
- **GET `/api/ai/weekly-insight`** (deterministik, tanpa LLM) — `data`:
  `{ ringkasan: string (siap ditampilkan), data: { totalJam14Hari, totalJam, rataRataJamHari, rataRataJamHariLalu, hariPuncak: {hari, jam}, keluhanUtama: {nama, jumlah}|null, tren: {arah: "naik"|"turun"|"stabil", persen}, jumlahHariData }, disclaimer }`.
- **GET `/api/ai/history`** (wajib Bearer token) — `data`: array maks 30 `AiInteraction` terbaru milik user, dibalik ke urutan kronologis.
  Tiap item: `{ id, pesanUser: string, responsAi: { analisis, rencana_pemulihan, saran_otc, peringatan, disclaimer, mode, modeLabel, isEmergency }|null, isEmergency: boolean, createdAt: ISO string }`.
  Frontend halaman Chat memakai ini untuk merender ulang riwayat percakapan saat halaman dibuka.

## 3. Dashboard (Pemilik: P3)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard/summary` | Total jam, pendapatan, keluhan (wajib Bearer token; data per-user dari JWT) |
| GET | `/api/dashboard/correlation` | Data grafik korelasi (wajib Bearer token). `data`: `{ hari: [{hari, tanggal, jamKerja, keluhan, pendapatan, isPuncak}], distribusiKeluhan: [{area, jumlah, persen}], totalKeluhan }` — kosong bila belum ada log |
| GET | `/api/dashboard/trend` | Data tren 7/30 hari (wajib Bearer token) |

## 4. Utility (Pemilik: P4)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pharmacy?lat=&lng=` | Proxy Overpass API (Apotek) |
| GET | `/api/reminders` | List reminder user |
| POST | `/api/reminders` | Buat reminder |

## 5. Usulan Endpoint Profil (P3 — belum diimplementasikan backend)

Frontend halaman Profil memanggil endpoint-endpoint berikut; saat ini dijawab 404 karena belum tersedia di backend (rute auth milik P1). Frontend menyediakan fallback ke penyimpanan lokal agar demo tetap berjalan.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| PUT | `/api/auth/me` | Update profil user aktif. Body: `{ name?: string (2-50), occupation?: string (maks 50), phone?: string }`. Mengembalikan `{ success, data: { user } }` |
| PUT | `/api/auth/me/password` | Ganti kata sandi. Body: `{ currentPassword: string, password: string (minimal 6) }` |
| DELETE | `/api/auth/me` | Hapus akun user aktif beserta seluruh data terkait (onDelete: Cascade pada WorkLog & AiInteraction) |
| PUT | `/api/auth/me/photo` | Upload/ganti foto profil user aktif. Body: `{ photo: string /* dataURL/base64, maks ±200 KB */ }`. Mengembalikan `{ success, data: { photo } }` |

Catatan foto profil: sampai `PUT /api/auth/me/photo` tersedia, frontend menyimpan foto profil secara lokal di perangkat (localStorage, dikecilkan ke maks 256px JPEG) dan menampilkannya di hero profil serta avatar navigasi.
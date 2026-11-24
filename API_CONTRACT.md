# API Contract — VITARA

Kontrak ini disepakati bersama. Jika butuh data dari P lain, gunakan endpoint ini.

## Autentikasi & CSRF
Sesi login disimpan server sebagai cookie `vitara_session` (`HttpOnly; SameSite=Lax; Path=/api`; `Secure` di produksi). JWT tidak lagi dikirim dalam body maupun header `Authorization`. frontend memanggil `GET /api/auth/csrf` sekali untuk mendapatkan cookie `vitara_csrf` (bisa dibaca JS), lalu mengirim nilainya sebagai header `X-CSRF-Token` pada setiap request POST, PUT, PATCH, dan DELETE. Cookie CSRF salah atau hilang → 403. `POST /api/auth/logout` mencabut JWT di server sampai masa berlakunya habis, jadi cookie lama tidak bisa dipakai ulang. Cache profil di `localStorage.user` hanya untuk tampilan, bukan untuk otorisasi.

## Format Standar
Sukses: `{ "success": true, "data": { ... } }`
Error: `{ "success": false, "error": "Pesan" }`

## Health Check
`GET /api/health` (tanpa autentikasi) mengembalikan `{ success, data: { status, database, uptimeDetik, memoriMB } }`. Status 503 bila database tidak dapat dijangkau. Dipakai Railway dan monitoring eksternal.

## 1. Auth & Logs (Pemilik: P1)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar user baru |
| POST | `/api/auth/login` | Login, set cookie sesi httpOnly |
| GET | `/api/auth/csrf` | Ambil cookie CSRF sebelum request perubahan data |
| POST | `/api/auth/logout` | Hapus cookie sesi & CSRF |
| POST | `/api/auth/forgot-password` | Kirim tautan reset kata sandi ke email |
| POST | `/api/auth/reset-password` | Atur kata sandi baru dengan token sekali pakai |
| GET | `/api/auth/me` | Profil user aktif (dari database) |
| PUT | `/api/auth/me` | Perbarui nama, profesi, telepon, email |
| PUT | `/api/auth/me/password` | Ganti kata sandi |
| DELETE | `/api/auth/me` | Hapus akun permanen (cascade) |
| PUT | `/api/auth/me/photo` | Simpan/ganti/hapus foto profil |
| GET | `/api/auth/oauth/google/start` | Mulai login Google (redirect) |
| GET | `/api/auth/oauth/google/callback` | Callback Google (redirect balik ke frontend) |
| POST | `/api/auth/oauth/exchange` | Tukar kode sekali pakai jadi cookie sesi httpOnly |
| GET | `/api/logs` | List log milik user |
| POST | `/api/logs` | Buat log baru |
| POST | `/api/logs/quick-log` | Duplikasi log terakhir |

`body.symptoms` dinormalisasi ke label kanonik: `Sakit Pinggang`, `Leher & Bahu`, `Lutut & Kaki`, `Pergelangan`, `Mata Lelah`, `Pusing Kepala`. Label `Bebas Keluhan & Bugar` dibuang saat disimpan (hari sehat = array kosong). Data lama tetap terbaca karena normalisasi juga dilakukan saat agregasi Dashboard.

Detail body Auth (Minggu 5: username sebagai kredensial utama):

- **POST `/api/auth/register`**: body: `{ name, username, phone?, occupation?, password }`.
  `username`: wajib, 3-20 karakter, hanya huruf kecil/angka/underscore (otomatis lowercase), unik per akun (case-insensitive).
  `phone`: opsional, dinormalisasi ke format `08xxx` bila diisi. Respons `{ success, data: { user } }`; cookie sesi di-set oleh server.
  Username ganda → 400 `"Username sudah dipakai. Silakan pilih username lain."`
- **POST `/api/auth/login`** — body: `{ username, password }` (username menjadi kredensial utama).
  Untuk kompatibilitas mundur, akun lama tanpa username masih bisa masuk dengan `{ phone, password }`.
  Akun Google (tanpa kata sandi) → 401 dengan pesan agar masuk lewat tombol Google.
  Kegagalan → 401 `"Username atau kata sandi tidak valid."`
- **GET `/api/auth/me`**: wajib cookie sesi. `data: { user }` dibaca langsung dari database: `{ id, username, phone, email, name, occupation, authProvider, createdAt }`.
  `phone` dan `email` bernilai `null` sampai user mengisinya di halaman Profil.
- **PUT `/api/auth/me`**: wajib cookie sesi. Body opsional: `{ name?, occupation?, phone?, email? }`.
  String kosong atau `null` mengosongkan field. Telepon/email ganda → 400. Respons `{ success, data: { user } }`.
- **PUT `/api/auth/me/password`**: wajib cookie sesi. Body: `{ currentPassword?, password }`.
  `password` minimal 6 karakter, wajib mengandung huruf dan angka (maksimal 72). `currentPassword` wajib bila akun sudah punya kata sandi;
  akun Google (belum punya kata sandi) boleh langsung membuat kata sandi baru.
  Respons `{ success, data: { diubah: true } }`.
- **DELETE `/api/auth/me`**: wajib cookie sesi. Menghapus akun beserta WorkLog, AiInteraction, & Reminder
  (onDelete: Cascade). Cookie sesi ikut dihapus. Respons `{ success, data: { id, message } }`.
- **POST `/api/auth/forgot-password`**: body `{ email }`. Selalu membalas 200 dengan pesan umum
  `"Jika email terdaftar, tautan reset sudah dikirim."` agar keberadaan email tidak bocor.
  Bila `RESEND_API_KEY` diisi, email dikirim lewat Resend; tanpa key, tautan hanya dicatat di log
  server saat mode non-produksi. Token disimpan sebagai hash, berlaku 30 menit, dan sekali pakai.
- **POST `/api/auth/reset-password`**: body `{ token, password }`. `password` minimal 6 karakter,
  wajib huruf dan angka. Token tidak valid atau kedaluwarsa → 400. Respons sukses
  `{ success, data: { message } }`; sesi lama tidak otomatis dicabut, jadi pengguna disarankan login ulang.
- **Google OAuth** (tanpa library tambahan, memakai `fetch`):
  1. Frontend membuka `GET /api/auth/oauth/google/start`. Server menyimpan `state` di cookie httpOnly lalu redirect ke Google.
  2. Google kembali ke `GET /api/auth/oauth/google/callback`. Server menukar `code`, mengambil profil, lalu login atau daftar otomatis berdasarkan email.
  3. Server redirect ke `<CLIENT_URL>/auth/callback?code=<kode sekali pakai>` (berlaku 2 menit, bukan JWT mentah).
  4. Frontend menukar kode: `POST /api/auth/oauth/exchange` body `{ code }` → `{ success, data: { user } }`, cookie sesi di-set server.
  Akun baru dari Google: `username` dibuat otomatis dari email, `phone` dan `password` kosong, `authProvider: "google"`.
  Bila email sudah terdaftar (misalnya diisi manual di Profil), akun itu ditautkan, bukan dibuat duplikat.
  Env wajib: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`, `CLIENT_URL`.

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
- **GET `/api/ai/history`** (wajib cookie sesi) — `data`: array maks 30 `AiInteraction` terbaru milik user, dibalik ke urutan kronologis.
  Tiap item: `{ id, pesanUser: string, responsAi: { analisis, rencana_pemulihan, saran_otc, peringatan, disclaimer, mode, modeLabel, isEmergency }|null, isEmergency: boolean, createdAt: ISO string }`.
  Frontend halaman Chat memakai ini untuk merender ulang riwayat percakapan saat halaman dibuka.

## 3. Dashboard (Pemilik: P3)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard/summary` | Total jam, pendapatan, keluhan (wajib cookie sesi; data per-user dari JWT) |
| GET | `/api/dashboard/correlation` | Data grafik korelasi (wajib cookie sesi). `data`: `{ hari: [{hari, tanggal, jamKerja, keluhan, pendapatan, isPuncak}], distribusiKeluhan: [{area, jumlah, persen}], rincianKeluhan: [{nama, jumlah, area}], totalKeluhan }` — kosong bila belum ada log |
| GET | `/api/dashboard/trend` | Data tren 7/30 hari (wajib cookie sesi) |

## 4. Utility (Pemilik: P4)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pharmacy?lat=&lng=` | Proxy OSM (Apotek). Menggabungkan Overpass, Nominatim (`amenity=pharmacy`), dan Photon; mendeteksi apotek tanpa kata "apotek" di nama, deduplikasi, urut terdekat, cache 10 menit. Bila hasil dalam radius permintaan kurang dari 5, otomatis diperluas ke 10 km dan `meta.radius` berisi radius yang dipakai |
| GET | `/api/reminders` | List reminder user (wajib cookie sesi) |
| POST | `/api/reminders` | Buat reminder (wajib cookie sesi) |
| PATCH | `/api/reminders/:id/toggle` | Aktif/nonaktifkan reminder milik user (wajib cookie sesi) |
| DELETE | `/api/reminders/:id` | Hapus reminder milik user (wajib cookie sesi) |
| GET | `/api/push/public-key` | Kunci publik VAPID untuk langganan Web Push |
| POST | `/api/push/subscribe` | Simpan langganan push per perangkat (wajib cookie sesi + CSRF) |

Catatan Web Push: kunci VAPID dibuat sekali dengan `npx web-push generate-vapid-keys` lalu disimpan sebagai `VAPID_PUBLIC`, `VAPID_PRIVATE`, dan `VAPID_SUBJECT` di Railway. Tanpa env ini scheduler push tidak aktif. Browser menyimpan langganan di tabel `PushSubscription` (cascade saat akun dihapus). Scheduler server mengecek setiap 30 detik (WIB) dan mengirim maksimal sekali per pengingat per hari lewat kolom `Reminder.lastSentAt`.

Catatan reminder: data tersimpan di tabel `Reminder` per-user (`userId` dari JWT), ikut terhapus saat akun dihapus (`onDelete: Cascade`). `days` berupa array hari, bukan string JSON.

Catatan audit: aksi daftar, masuk, masuk Google, ganti sandi, dan hapus akun tercatat di tabel `AuditLog` (`aksi`, `detail`, `ip`, `userAgent`, `createdAt`). Tidak ada endpoint baca audit log untuk sementara.

Catatan apotek: hasil berasal dari tiga sumber OpenStreetMap (Overpass, Nominatim, Photon) yang digabung dan deduplikasi, lalu diurutkan berdasarkan jarak Haversine dan dibatasi radius. Overpass dipakai lewat GET ke beberapa mirror karena sebagian mirror menolak POST atau hanya memuat data regional.

## 5. Endpoint Profil (sudah diimplementasikan)

`PUT /api/auth/me`, `PUT /api/auth/me/password`, `DELETE /api/auth/me`, dan `PUT /api/auth/me/photo`
sudah tersedia di backend (lihat bagian Auth).

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| PUT | `/api/auth/me` | Update profil user aktif. Body: `{ name?: string (2-50), occupation?: string (maks 50), phone?: string, email?: string }`. Mengembalikan `{ success, data: { user } }` |
| PUT | `/api/auth/me/password` | Ganti kata sandi. Body: `{ currentPassword?: string, password: string (6-72, huruf + angka) }` |
| DELETE | `/api/auth/me` | Hapus akun user aktif beserta seluruh data terkait (onDelete: Cascade pada WorkLog, AiInteraction, & Reminder) |
| PUT | `/api/auth/me/photo` | Simpan/ganti/hapus foto profil user aktif. Body: `{ photo: string /* dataURL JPEG/PNG/WebP, maks 200 KB */ \| null }`. Mengembalikan `{ success, data: { user } }` |

Catatan foto profil: foto disimpan di kolom `User.photo` (dataURL, dikecilkan frontend ke maks 256px JPEG) sehingga tetap ada saat login dari perangkat lain. `photo: null` menghapus foto dan avatar kembali menampilkan inisial.
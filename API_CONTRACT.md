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

## 2. AI Engine (Pemilik: P2)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/ai/coach` | Kirim teks keluhan, dapat JSON respons |
| GET | `/api/ai/risk-score` | Skor risiko harian (0-100) |
| GET | `/api/ai/weekly-insight` | Ringkasan mingguan |

Detail respons (Minggu 2-4, semuanya `{ success: true, data: {...} }`):

- **POST `/api/ai/coach`** — body: `{ pesan: string (3-1000 karakter) }` (alias `message`/`keluhan` diterima).
  `data`: `{ analisis, rencana_pemulihan: [{judul, detail}], saran_otc: [{nama, detail}], peringatan, disclaimer, isEmergency, mode, modeLabel, logCount, interaksiId, tersimpan }`.
  Keyword darurat ("nyeri dada", "sesak napas", "pingsan") → `isEmergency: true`, tidak memanggil LLM.
- **GET `/api/ai/risk-score`** (deterministik, tanpa LLM) — `data`:
  `{ skor: number|null, level: "Risiko Tinggi"|"Risiko Sedang"|"Risiko Rendah"|null, kepercayaan: "tinggi"|"sedang"|"rendah"|null, mode, modeLabel, jumlahLog, komponen: [{nama, poin, maks, bobot, detail}], saran, periode, disclaimer }`.
  Ambang level (sinkron widget Dashboard P3): skor >= 70 Tinggi, >= 40 Sedang. `skor: null` saat belum ada log.
- **GET `/api/ai/weekly-insight`** (deterministik, tanpa LLM) — `data`:
  `{ ringkasan: string (siap ditampilkan), data: { totalJam14Hari, totalJam, rataRataJamHari, rataRataJamHariLalu, hariPuncak: {hari, jam}, keluhanUtama: {nama, jumlah}|null, tren: {arah: "naik"|"turun"|"stabil", persen}, jumlahHariData }, disclaimer }`.

## 3. Dashboard (Pemilik: P3)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard/summary` | Total jam, pendapatan, keluhan |
| GET | `/api/dashboard/correlation` | Data grafik korelasi |
| GET | `/api/dashboard/trend` | Data tren 7/30 hari |

## 4. Utility (Pemilik: P4)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pharmacy?lat=&lng=` | Proxy Overpass API (Apotek) |
| GET | `/api/reminders` | List reminder user |
| POST | `/api/reminders` | Buat reminder |
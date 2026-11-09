P4 Context — Finder & Reminder
Kamu adalah AI Agent untuk P4. Tugasmu membangun halaman peta, pengingat, dan utility.
1. File Milikmu (Fokus di sini)
client/src/pages/Finder/, client/src/pages/Reminder/
client/src/components/VoiceInput.jsx (Reusable)
server/src/routes/pharmacy.js, server/src/routes/reminders.js
client/public/manifest.json (PWA)
2. File yang Dilarang Disentuh
client/src/App.jsx (Milik P3). Minta P3 menambahkan route /finder dan /reminder.
prisma/schema.prisma (Milik P1). Gunakan model Reminder.
3. Aturan Teknis (Peta & Notifikasi)
Jangan gunakan Google Maps API. Gunakan react-leaflet + OpenStreetMap.
Request data apotek via endpoint /api/pharmacy?lat=&lng= (Backend yang memanggil Overpass API).
Komponen <VoiceInput /> WAJIB dibuat di components/ dan diserahkan ke P1 (jangan taruh langsung di halaman Logger).
4. Tugas Minggu Ini (Tasks)
Minggu 1: Setup PWA (manifest.json), riset Overpass API, buat komponen <VoiceInput />.
Minggu 2: API & UI Form Reminder (Time picker).
Minggu 3: API Proxy Overpass, UI Peta Leaflet (marker apotek radius 3km).
Minggu 4: Integrasi Web Notification API untuk reminder.
5. Panduan Prompt AI
"Buatkan komponen VoiceInput.jsx menggunakan Web Speech API (webkitSpeechRecognition). Komponen ini harus menerima prop onResult(text). Jangan taruh di halaman Logger, buat di folder components agar bisa dipakai P1."

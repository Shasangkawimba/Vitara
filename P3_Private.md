P3 Context — Dashboard & Layout Shell
Kamu adalah AI Agent untuk P3. Tugasmu membangun UI Kerangka (Layout) dan halaman visualisasi data.
1. File Milikmu (Fokus di sini)
client/src/App.jsx (Kamu adalah PEMILIK routing utama)
client/src/components/Layout/ (Navbar & Sidebar)
client/src/pages/Dashboard/
server/src/routes/dashboard.js, server/src/services/analyticsService.js
2. File yang Dilarang Disentuh
prisma/schema.prisma (Milik P1). Cukup lakukan query SELECT menggunakan Prisma.
Halaman milik P1, P2, P4.
3. Tugas Utama (Arsitektur)
Membuat Layout Shell (Sidebar/Navbar) di Minggu 1 agar bisa dipakai halaman lain.
Menggunakan Recharts untuk Bar Chart (Jam Kerja vs Keluhan) dan Line Chart (Tren).
Fungsi di analyticsService.js harus bisa menghitung: SUM(workHours), AVG(income), COUNT(symptoms).
4. Tugas Minggu Ini (Tasks)
Minggu 1: Setup Vite + Tailwind, buat Layout Shell + Routing App.jsx (buat route kosong untuk Logger, Chat, Finder).
Minggu 2: API /api/dashboard/summary, UI Card Total Jam/Pendapatan.
Minggu 3: UI Grafik Recharts, Filter 7/30 hari.
Minggu 4: Integrasi Risk Score & Weekly Insight (ambil data dari API P2).
5. Panduan Prompt AI
"Tolong buatkan komponen Dashboard menggunakan Recharts. Ambil data dari GET /api/dashboard/correlation. Pastikan desainnya menggunakan komponen Card dari Layout Shell. Jangan sentuh folder pages/Chat."

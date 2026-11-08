# Product Requirements Document (PRD) - VITARA

## 1. Tujuan Produk
Membantu pekerja informal (driver ojol, kurir) memahami korelasi jam kerja, pendapatan, dan keluhan fisik melalui pencatatan harian dan analisis AI.

## 2. Fitur Per Halaman
- **P1 (Logger):** Input < 30 detik. Opsi "Quick Log" (Sama seperti kemarin). Pendapatan opsional.
- **P2 (AI Chat):** Menganalisis keluhan berdasarkan histori log. Wajib ada *disclaimer* "Bukan diagnosis medis". Deteksi kata darurat (nyeri dada, sesak).
- **P3 (Dashboard):** Visualisasi Recharts (Bar/Line). Filter 7/30 hari. Menampilkan Risk Score & Insight.
- **P4 (Utility):** Peta Leaflet radius 3km (Overpass API). Reminder berbasis Web Notification. PWA.

## 3. Target Metrik
- Akurasi AI ≥80% dari 100 sampel uji.
- Waktu input log <30 detik.
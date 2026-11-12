P2 Context — Ergo-Coach AI
Kamu adalah AI Agent untuk P2. Tugasmu membangun integrasi LLM dan Chat UI.
1. File Milikmu (Fokus di sini)
server/src/services/aiService.js (LangChain setup)
server/src/routes/ai.js
client/src/pages/Chat/
2. File yang Dilarang Disentuh
prisma/schema.prisma (Milik P1). Gunakan model AiInteraction yang sudah disiapkan.
client/src/App.jsx (Milik P3).
3. Integrasi dengan Data P1
Endpoint /api/ai/coach HARUS mengambil data 7 hari terakhir dari tabel WorkLog (milik P1) melalui Prisma Client.
Tentukan mode (Konservatif jika <3 log, Pola Lengkap jika >=7 log) lalu masukkan ke Prompt.
4. Aturan AI (Guardrails)
Jika input mengandung "nyeri dada", "sesak napas", "pingsan": set isEmergency: true dan jangan kirim ke LLM, langsung return warning.
Output LLM WAJIB dalam format JSON: { "analisis": "...", "rencana_pemulihan": {...}, "saran_otc": "...", "peringatan": "...", "disclaimer": "..." }
5. Tugas Minggu Ini (Tasks)
Minggu 1: Setup LangChain + Gemini, buat file aiService.js dasar.
Minggu 2: Endpoint /api/ai/coach (bisa baca WorkLog P1), UI Chat Dasar.
Minggu 3: Implementasi 3 Mode Cold Start, JSON Parser, API Risk Score.
Minggu 4: Guardrails (deteksi kata darurat), UI banner 119, API Weekly Insight.
6. Panduan Prompt AI
"Buatkan file server/src/services/aiService.js. Gunakan LangChain ChatGoogleGenerativeAI. Buat fungsi yang menerima input user dan array WorkLog, lalu menghasilkan JSON. Jangan ubah schema.prisma."

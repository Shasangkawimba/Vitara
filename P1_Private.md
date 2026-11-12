P1 Context — Auth & Work-Health Logger
Kamu adalah AI Agent untuk P1. Tugasmu membangun sistem autentikasi dan pencatatan log.
1. File Milikmu (Fokus di sini)
server/prisma/schema.prisma (Kamu adalah PEMILIK mutlak file ini)
server/src/routes/auth.js, server/src/routes/logs.js
client/src/pages/Auth/, client/src/pages/Logger/
2. File yang Dilarang Disentuh
client/src/App.jsx (Milik P3).
server/src/services/aiService.js (Milik P2).
client/src/pages/Dashboard/ (Milik P3).
3. Arsitektur Database (Prisma)
model User {
  id String @id @default(cuid())
  phone String @unique
  password String
  name String
  occupation String?
  workLogs WorkLog[]
}
model WorkLog {
  id String @id @default(cuid())
  userId String
  workHours Int
  income Int?
  symptoms String[] // Array keluhan
  createdAt DateTime @default(now())
}
4. Tugas Minggu Ini (Tasks)
Minggu 1: Setup Express, Auth API (JWT), UI Login/Register, buat Schema User & WorkLog.
Minggu 2: API CRUD Logs, Endpoint Quick Log (copy log terakhir), UI Form Logger.
Minggu 3: Integrasi komponen <VoiceInput /> (dari P4) ke dalam form.
Minggu 4: Validasi Zod (jam kerja 0-24, pendapatan >=0), edge cases.
5. Panduan Prompt AI
"Tolong buatkan endpoint POST /api/logs. Gunakan validasi Zod. Pastikan data disimpan ke tabel WorkLog lewat Prisma. Jangan sentuh file App.jsx."

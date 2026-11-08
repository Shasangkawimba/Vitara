# server/prisma/

Folder ini milik **P1**.

- `schema.prisma` dibuat & di-commit oleh P1 — jangan dibuat/diedit oleh pemilik lain
  (aturan emas AGENTS.md no. 2).
- `migrations/` dihasilkan perintah `npx prisma migrate dev` oleh P1.

Untuk anggota lain: cukup buat `server/.env` berisi `DATABASE_URL` yang P1 berikan,
lalu jalankan migrasi versi P1. Jangan pernah buat model sendiri di schema.

# AGENTS.md — Aturan Mutlak AI Agent

Dokumen ini dibaca oleh AI Agent  milik SEMUA anggota.

## 1. Aturan Emas (Jangan Dilanggar)
1. **Fokus Pada File Private Anda:** Baca file `P<X>_PRIVATE.md` Anda. Jangan pernah menyentuh file di folder halaman anggota lain (misal P2 tidak boleh edit `pages/Logger`).
2. **Jangan Ubah Schema:** File `prisma/schema.prisma` HANYA milik P1.
3. **Jangan Ubah Routing:** File `client/src/App.jsx` HANYA milik P3.
4. **Ikuti API_CONTRACT:** Jangan buat endpoint baru tanpa update `API_CONTRACT.md`.
5. **Bahasa:** Semua komentar kode, UI, dan pesan error gunakan Bahasa Indonesia.
6. **Format API:** Semua endpoint mengembalikan `{ success: boolean, data?: any, error?: string }`.

## 2. Protokol Git (Anti-Konflik)
- AI DILARANG melakukan `git push` atau `git merge`.
- AI hanya bertugas menulis kode. Anggota (manusia) yang melakukan commit dan push manual.
- Sebelum meminta AI menulis kode, pastikan Anda sudah `git pull origin dev`.

## 3. Standar Teknis
- **Frontend:** Functional Component (Hooks). Styling pakai Tailwind utility. Request API pakai `axios` instance di `services/api.js`.
- **Backend:** Pisahkan Route (`routes/`) dan Business Logic (`services/`). Validasi input wajib pakai `zod`.
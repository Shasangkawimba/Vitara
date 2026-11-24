# VITARA — Virtual Assistant for Tracking and Recovery

Asisten kesehatan kerja berbasis AI untuk pekerja informal dan gig economy Indonesia.

## Arsitektur Pembagian Tugas (1 Orang = 1 Page)
| Anggota | Page | Fokus Fitur | File Private Context |
|---------|------|-------------|----------------------|
| P1 | Auth & Logger | Login, Form Log, Quick Log | Baca `P1_PRIVATE.md` |
| P2 | Ergo-Coach AI | Chat AI, LLM Prompting | Baca `P2_PRIVATE.md` |
| P3 | Dashboard | Layout Shell, Recharts | Baca `P3_PRIVATE.md` |
| P4 | Finder & Reminder| Peta Leaflet, Reminder, PWA | Baca `P4_PRIVATE.md` |

## Tech Stack
Frontend: React 18, Vite, Tailwind CSS, Recharts, React-Leaflet.
Backend: Express.js, Prisma ORM, PostgreSQL.
AI: LangChain.js, Gemini 3.8 Flash (Primary), Groq (Fallback).

## Cara Menjalankan (Lokal)
    1. npm install (di root, client, dan server)
    2. cp server/.env.example server/.env
    3. npm run db:push --prefix server
    4. npm run dev

Health check lokal: `http://localhost:5001/api/health`.

## Deploy (Produksi)
- Frontend: Vercel, domain `https://vitara-gig.vercel.app`, root directory `client`.
  Rewrite `/api/*` ke backend Railway diatur di `client/vercel.json`.
- Backend: Railway, service `vitara-backend`, root directory `server`.
- Database: Neon, dipakai bersama oleh lokal dan produksi.
- Env backend yang wajib: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `OAUTH_REDIRECT_URI=https://vitara-gig.vercel.app/api/auth/oauth/google/callback`,
  `CLIENT_URL=https://vitara-gig.vercel.app`,
  `ALLOWED_ORIGIN=https://vitara-gig.vercel.app`, `NODE_ENV=production`.
- Web Push (opsional, tanpa ini alarm hanya hidup saat tab terbuka):
  `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT`. Buat dengan
  `npx web-push generate-vapid-keys` di folder `server`.
- Reset sandi lewat email (opsional): `RESEND_API_KEY` dan `EMAIL_FROM`.
  Tanpa key, tautan reset hanya muncul di log server saat mode non-produksi.
- Analytics frontend (opsional): `VITE_GTM_ID` atau `VITE_GA4_ID` di Vercel.
  Tanpa ID, event `cta_click` tidak dikirim ke mana pun.
- `OAUTH_REDIRECT_URI` memakai domain Vercel, bukan Railway, supaya cookie
  `state` OAuth tetap satu host saat request lewat rewrite `/api`.
- Daftarkan URL itu di Google Console > Credentials > Authorized redirect URIs,
  bersama versi lokal `http://localhost:5001/api/auth/oauth/google/callback`.
- Push ke `main` memicu deploy otomatis Vercel dan Railway. Bila schema Prisma
  berubah, jalankan `npm run db:push --prefix server` sebelum deploy.

## Dokumentasi Wajib
- `AGENTS.md` (Aturan mutlak AI Agent)
- `API_CONTRACT.md` (Kontrak Endpoint API)
- `CONTRIBUTING.md` (Alur kerja & Standar Kode)
- `GITFLOW.md` (Aturan Git)
- `PRD.md` (Product Requirements)
- `P1_PRIVATE.md` s/d `P4_PRIVATE.md` (Konteks spesifik per anggota)
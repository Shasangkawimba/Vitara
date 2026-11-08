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
AI: LangChain.js, Gemini 2.0 Flash (Primary), Groq (Fallback).

## Cara Menjalankan (Lokal)
    1. npm install (di root, client, dan server)
    2. cp server/.env.example server/.env
    3. npx prisma migrate dev
    4. npm run dev

## Dokumentasi Wajib
- `AGENTS_GLOBAL.md` (Aturan mutlak AI Agent)
- `API_CONTRACT.md` (Kontrak Endpoint API)
- `CONTRIBUTING.md` (Alur kerja & Standar Kode)
- `GITFLOW.md` (Aturan Git)
- `PRD.md` (Product Requirements)
- `P1_PRIVATE.md` s/d `P4_PRIVATE.md` (Konteks spesifik per anggota)
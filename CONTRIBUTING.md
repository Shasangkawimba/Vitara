# Panduan Kontribusi & Anti-Konflik

## 1. Penamaan Branch & Commit
Wajib pakai prefix P (P1, P2, P3, P4).
- Branch: `feature/p2-chat-ui`
- Commit: `feat(p2): integrasi LangChain`

## 2. File Rawan Konflik (Protokol Khusus)
| File | Pemilik | Aturan |
|------|---------|--------|
| `schema.prisma` | P1 | Jika butuh field baru, minta P1 yang tambahkan. |
| `client/src/App.jsx` | P3 | Jika butuh route baru, kirim potongan kode ke P3. |
| `package.json` | P1 | Jangan install library baru tanpa persetujuan P1. |

## 3. Code Review
- P1 me-review PR P4.
- P2 me-review PR P3.
- Jangan merge PR sendiri.
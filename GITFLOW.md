# Gitflow Tim VITARA

> Catatan (keputusan tim): proyek ini TIDAK memakai branch `dev`.
> Hanya ada `main` + branch fitur masing-masing anggota. PR fitur
> ditujukan langsung ke `main`.

## Alur Harian
    1. Pagi: git checkout main && git pull origin main
    2. Buat branch: git checkout -b feature/p<X>-<fitur>
    3. Ngoding bareng AI Agent.
    4. Sore (sebelum PR): git merge main (selesaikan konflik di lokal)
    5. Push: git push origin feature/p<X>-<fitur>
    6. Buka PR ke main, tunggu review, Squash & Merge.

## Aturan Emas
1. Jangan pernah push langsung ke `main` — wajib lewat PR + review.
2. Jangan `git add .`. Gunakan `git add <file-spesifik>`.
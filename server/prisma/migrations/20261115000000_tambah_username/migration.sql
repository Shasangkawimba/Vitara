-- Migrasi: tambah kolom username pada tabel User (Minggu 5)
-- Kredensial login utama berubah dari phone menjadi username.
-- Kolom nullable agar akun lama (hanya punya phone) tetap bisa masuk
-- via alias kompatibilitas mundur.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

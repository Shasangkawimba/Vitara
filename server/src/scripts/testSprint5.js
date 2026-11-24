// Uji HTTP Sprint 5: cookie sesi httpOnly + CSRF double-submit.
// Jalankan dengan server aktif: node src/scripts/testSprint5.js
const assert = require("node:assert/strict");

const base = "http://localhost:5001";
const jar = new Map();
const suffix = Date.now().toString();
const username = `s5_${suffix}`;

function daftarCookie(res) {
  const mentah =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie")].filter(Boolean);
  for (const baris of mentah) {
    const [pasangan] = baris.split(";");
    const posisi = pasangan.indexOf("=");
    if (posisi < 0) continue;
    const kunci = pasangan.slice(0, posisi).trim();
    if (kunci === "vitara_session" || kunci === "vitara_csrf") {
      jar.set(kunci, pasangan.slice(posisi + 1).trim());
    }
  }
  return mentah;
}

function cookieJar() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, { method = "GET", body, csrf = false, csrfOverride, cookie, pakaiCookie = true } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const isiCookie = cookie !== undefined ? cookie : pakaiCookie ? cookieJar() : "";
  if (isiCookie) headers.Cookie = isiCookie;
  if (csrf) headers["X-CSRF-Token"] = csrfOverride ?? jar.get("vitara_csrf") ?? "";

  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const cookieMentah = daftarCookie(res);
  let json = null;
  try {
    json = await res.json();
  } catch {
    // respons tanpa JSON tidak dipakai dalam uji ini
  }
  return { status: res.status, json, cookieMentah };
}

async function main() {
  // 1. CSRF cookie harus tersedia lebih dulu.
  const csrf = await req("/api/auth/csrf");
  assert.equal(csrf.status, 200);
  const barisCsrf = csrf.cookieMentah.find((s) => s.startsWith("vitara_csrf=")) || "";
  assert.match(barisCsrf, /Path=\//, "cookie CSRF terbaca JS (path /)");
  assert.doesNotMatch(barisCsrf, /HttpOnly/i, "cookie CSRF tidak httpOnly");

  // 2. Tanpa header CSRF, pendaftaran ditolak.
  const tanpaCsrf = await req("/api/auth/register", {
    method: "POST",
    body: { username, password: "uji123", name: "Uji Sprint 5" },
  });
  assert.equal(tanpaCsrf.status, 403, "request tanpa CSRF ditolak");
  assert.match(tanpaCsrf.json.error, /Token keamanan/);

  // 3. CSRF benar → daftar, cookie sesi httpOnly, token tidak bocor di body.
  const daftar = await req("/api/auth/register", {
    method: "POST",
    csrf: true,
    body: { username, password: "uji123", name: "Uji Sprint 5" },
  });
  assert.equal(daftar.status, 201, `daftar gagal: ${JSON.stringify(daftar.json)}`);
  assert.equal(daftar.json.data.token, undefined, "JWT tidak dikirim di body");
  const barisSesi = daftar.cookieMentah.find((s) => s.startsWith("vitara_session=")) || "";
  assert.match(barisSesi, /HttpOnly/i, "cookie sesi httpOnly");
  assert.match(barisSesi, /Path=\/api/, "cookie sesi hanya untuk /api");
  assert.match(barisSesi, /SameSite=Lax/i);

  // 4. Sesi dipakai otomatis dari cookie, tanpa Authorization header.
  const profil = await req("/api/auth/me");
  assert.equal(profil.status, 200, "GET me memakai cookie sesi");

  const tanpaSesi = await req("/api/auth/me", { cookie: "" });
  assert.equal(tanpaSesi.status, 401, "GET me tanpa sesi ditolak");

  // 5. CSRF salah tetap ditolak walau sesi benar.
  const csrfSalah = await req("/api/auth/me", {
    method: "PUT",
    csrf: true,
    csrfOverride: "token_salah",
    body: { name: "Uji Sprint 5" },
  });
  assert.equal(csrfSalah.status, 403, "header CSRF salah ditolak");

  const ubah = await req("/api/auth/me", {
    method: "PUT",
    csrf: true,
    body: { name: "Uji Sprint 5 Diubah" },
  });
  assert.equal(ubah.status, 200, "PUT me dengan CSRF benar");

  const gantiSandi = await req("/api/auth/me/password", {
    method: "PUT",
    csrf: true,
    body: { currentPassword: "uji123", password: "uji456" },
  });
  assert.equal(gantiSandi.status, 200, "ganti sandi berhasil");

  const sandiLama = await req("/api/auth/login", {
    method: "POST",
    csrf: true,
    body: { username, password: "uji123" },
  });
  assert.equal(sandiLama.status, 401, "sandi lama ditolak");

  // 6. Logout menghapus sesi; cookie lama tidak bisa dipakai lagi.
  const cookieLama = cookieJar();
  const keluar = await req("/api/auth/logout", { method: "POST", csrf: true });
  assert.equal(keluar.status, 200, "logout berhasil");
  const sesiSetelahKeluar = await req("/api/auth/me", { cookie: cookieLama });
  assert.equal(sesiSetelahKeluar.status, 401, "cookie lama tidak berlaku setelah logout");

  // 7. Login ulang dan hapus akun untuk membersihkan data uji.
  await req("/api/auth/csrf");
  const masuk = await req("/api/auth/login", {
    method: "POST",
    csrf: true,
    body: { username, password: "uji456" },
  });
  assert.equal(masuk.status, 200, `login ulang gagal: ${JSON.stringify(masuk.json)}`);
  assert.equal(masuk.json.data.token, undefined, "JWT login tidak dikirim di body");

  const hapus = await req("/api/auth/me", { method: "DELETE", csrf: true });
  assert.equal(hapus.status, 200, `hapus akun gagal: ${JSON.stringify(hapus.json)}`);

  console.log("Sprint 5 OK: cookie sesi httpOnly, CSRF, logout, login ulang, hapus akun.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

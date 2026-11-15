// ============================================================
// client/src/pages/Profile/index.jsx
// Halaman Profil Pengguna — lihat & ubah data diri, ubah kata
// sandi, dan hapus akun permanen. Dibangun mengikuti desain
// Stitch: hero pine memudar ke kanvas, kartu rounded-4xl, zona
// berbahaya berlatar merah muda. Seluruh label berbahasa
// Indonesia.
// Catatan: endpoint PUT/DELETE /api/auth/me belum tersedia di
// backend (milik P1). Saat panggilan gagal, penyimpanan profil
// dilindungi ke localStorage agar demo tetap berjalan; kata
// sandi & penghapusan akun menampilkan pesan jujur tanpa
// menyimpan sandi secara lokal.
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

// Normalisasi nomor telepon Indonesia ke format 08xxx.
const normalisasiTelepon = (nilai) => {
  let bersih = (nilai || "").replace(/[\s\-()]/g, "");
  if (bersih.startsWith("+62")) bersih = "0" + bersih.slice(3);
  else if (bersih.startsWith("62") && bersih.length >= 11) bersih = "0" + bersih.slice(2);
  else if (bersih.startsWith("8") && !bersih.startsWith("0")) bersih = "0" + bersih;
  return bersih;
};

const inisialDariNama = (nama) => {
  if (!nama) return "V";
  return nama
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((kata) => kata[0])
    .join("")
    .toUpperCase();
};

const formatTanggal = (iso) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "-";
  }
};

export const ProfilePage = () => {
  const navigate = useNavigate();

  // Data dasar langsung dari localStorage agar halaman instan,
  // lalu disegarkan dari GET /api/auth/me bila berhasil.
  const [user, setUser] = useState(() => {
    try {
      const tersimpan = localStorage.getItem("user");
      return tersimpan ? JSON.parse(tersimpan) : null;
    } catch {
      return null;
    }
  });

  // Formulir informasi pribadi.
  const [form, setForm] = useState({ name: "", occupation: "", phone: "" });
  // Formulir kata sandi.
  const [sandi, setSandi] = useState({ lama: "", baru: "", konfirmasi: "" });
  const [lihatSandi, setLihatSandi] = useState(false);

  const [menyimpan, setMenyimpan] = useState(false);
  const [menggantiSandi, setMenggantiSandi] = useState(false);
  const [modalHapus, setModalHapus] = useState(false);
  const [teksKonfirmasi, setTeksKonfirmasi] = useState("");
  const [menghapus, setMenghapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState("");

  // Pesan kilat: { tipe: "sukses"|"peringatan"|"error", teks: string }.
  const [pesan, setPesan] = useState(null);

  // Isi formulir dari data user begitu tersedia.
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        occupation: user.occupation || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Segarkan dari backend bila endpoint /me menjawab.
  useEffect(() => {
    let batal = false;
    api
      .get("/auth/me")
      .then((res) => {
        if (batal) return;
        const terbaru = res.data?.data?.user;
        if (terbaru) {
          setUser((sebelumnya) => ({ ...sebelumnya, ...terbaru }));
          setForm({
            name: terbaru.name || "",
            occupation: terbaru.occupation || "",
            phone: terbaru.phone || "",
          });
        }
      })
      .catch(() => {
        /* Tetap gunakan data lokal bila backend belum menjawab. */
      });
    return () => {
      batal = true;
    };
  }, []);

  const inisial = useMemo(() => inisialDariNama(user?.name), [user?.name]);
  const telepon = user?.phone ? normalisasiTelepon(user.phone) : "-";

  const gabungkanUser = (bagian) => {
    setUser((sebelumnya) => {
      const terbaru = { ...(sebelumnya || {}), ...bagian };
      try {
        localStorage.setItem("user", JSON.stringify(terbaru));
      } catch {
        /* Abaikan bila storage penuh/terblokir. */
      }
      return terbaru;
    });
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((sebelumnya) => ({ ...sebelumnya, [name]: value }));
  };

  const handleChangeSandi = (e) => {
    const { name, value } = e.target;
    setSandi((sebelumnya) => ({ ...sebelumnya, [name]: value }));
  };

  // Foto profil: dipilih, dikecilkan ke maks 256px JPEG, lalu disimpan
  // lokal di data user (backend belum punya endpoint foto).
  const berkasFoto = useRef(null);
  const foto = user?.photo || null;

  const simpanFoto = (dataUrl) => {
    gabungkanUser({ photo: dataUrl });
    setPesan({ tipe: "sukses", teks: "Foto profil berhasil diperbarui." });
    window.dispatchEvent(new Event("vitara-user-changed"));
  };

  const handlePilihBerkas = (e) => {
    const berkas = e.target.files?.[0];
    e.target.value = "";
    if (!berkas) return;
    if (!berkas.type.startsWith("image/")) {
      setPesan({ tipe: "error", teks: "File harus berupa gambar (JPG/PNG/WebP)." });
      return;
    }
    if (berkas.size > 2 * 1024 * 1024) {
      setPesan({ tipe: "error", teks: "Ukuran gambar maksimal 2 MB." });
      return;
    }
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onload = () => {
        const sisi = 256;
        const skala = Math.min(1, sisi / Math.max(gambar.width, gambar.height));
        const kanvas = document.createElement("canvas");
        kanvas.width = Math.max(1, Math.round(gambar.width * skala));
        kanvas.height = Math.max(1, Math.round(gambar.height * skala));
        kanvas
          .getContext("2d")
          .drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        simpanFoto(kanvas.toDataURL("image/jpeg", 0.85));
      };
      gambar.onerror = () =>
        setPesan({ tipe: "error", teks: "Gagal membaca gambar. Coba file lain." });
      gambar.src = pembaca.result;
    };
    pembaca.readAsDataURL(berkas);
  };

  const hapusFoto = () => {
    gabungkanUser({ photo: null });
    setPesan({
      tipe: "peringatan",
      teks: "Foto profil dihapus — avatar kembali menampilkan inisial.",
    });
    window.dispatchEvent(new Event("vitara-user-changed"));
  };

  const simpanProfil = async (e) => {
    e.preventDefault();
    const nama = form.name.trim();
    const profesi = form.occupation.trim();
    const teleponBaru = normalisasiTelepon(form.phone);

    if (nama.length < 2) {
      setPesan({ tipe: "error", teks: "Nama lengkap wajib diisi (minimal 2 karakter)." });
      return;
    }
    if (profesi.length > 50) {
      setPesan({ tipe: "error", teks: "Profesi maksimal 50 karakter." });
      return;
    }
    if (!/^08\d{7,13}$/.test(teleponBaru)) {
      setPesan({ tipe: "error", teks: "Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx." });
      return;
    }

    const payload = { name: nama, occupation: profesi, phone: teleponBaru };
    try {
      setMenyimpan(true);
      const respons = await api.put("/auth/me", payload);
      const terbaru = respons.data?.data?.user || payload;
      gabungkanUser(terbaru);
      setPesan({ tipe: "sukses", teks: "Informasi pribadi berhasil diperbarui." });
    } catch (err) {
      // Endpoint belum tersedia di backend — lindungi perubahan di perangkat.
      gabungkanUser(payload);
      setPesan({
        tipe: "peringatan",
        teks:
          "Backend belum menyediakan PUT /api/auth/me — perubahan tersimpan di perangkat ini dan akan tersinkron saat endpoint aktif.",
      });
    } finally {
      setMenyimpan(false);
    }
  };

  const gantiSandi = async (e) => {
    e.preventDefault();
    if (sandi.baru.length < 6) {
      setPesan({ tipe: "error", teks: "Kata sandi baru minimal 6 karakter." });
      return;
    }
    if (sandi.baru !== sandi.konfirmasi) {
      setPesan({ tipe: "error", teks: "Konfirmasi kata sandi baru tidak cocok." });
      return;
    }
    try {
      setMenggantiSandi(true);
      await api.put("/auth/me/password", {
        currentPassword: sandi.lama,
        password: sandi.baru,
      });
      setSandi({ lama: "", baru: "", konfirmasi: "" });
      setPesan({ tipe: "sukses", teks: "Kata sandi berhasil diperbarui." });
    } catch (err) {
      const belumTersedia = !err.response || err.response.status === 404;
      setPesan({
        tipe: "error",
        teks: belumTersedia
          ? "Endpoint pengubahan kata sandi belum tersedia di backend (PUT /api/auth/me/password)."
          : "Gagal mengganti kata sandi: " +
            (err.response?.data?.error || "Periksa kembali kata sandi lama Anda."),
      });
    } finally {
      setMenggantiSandi(false);
    }
  };

  const hapusAkun = async () => {
    if (teksKonfirmasi !== "HAPUS") return;
    setGalatHapus("");
    try {
      setMenghapus(true);
      await api.delete("/auth/me");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } catch (err) {
      setMenghapus(false);
      setGalatHapus(
        "Gagal menghapus akun — endpoint DELETE /api/auth/me belum tersedia di backend. Hubungi tim backend (P1)."
      );
    }
  };

  // Guard: perlu login dulu untuk melihat profil.
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[32px]">person_off</span>
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-text-primary">
          Profil belum tersedia
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Anda belum masuk atau data sesi tidak ditemukan. Masuk kembali untuk mengelola informasi akun Anda.
        </p>
        <Link
          to="/login"
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Masuk ke VITARA
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero band pine — konsisten dengan halaman lain */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-6 pt-6 text-white lg:px-12 lg:pt-8">
        <div className="flex items-center gap-4 lg:gap-7">
          <span className="relative shrink-0">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/10 text-2xl font-bold lg:h-20 lg:w-20 lg:rounded-4xl lg:text-3xl">
              {foto ? (
                <img
                  src={foto}
                  alt={`Foto ${user.name || "profil"}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                inisial
              )}
            </span>
            <button
              type="button"
              onClick={() => berkasFoto.current?.click()}
              aria-label="Ubah foto profil"
              title="Ubah foto profil"
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-primary text-white shadow-hero transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-[15px]">photo_camera</span>
            </button>
            <input
              ref={berkasFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePilihBerkas}
            />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Profil &amp; Pengaturan Akun
            </span>
            <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight lg:text-[32px]">
              {user.name || "Pengguna VITARA"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {user.occupation ? `${user.occupation} • ` : ""}Bergabung {formatTanggal(user.createdAt)}
            </p>
            <span className="glass-pill mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white">
              <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
              {telepon}
            </span>
          </div>
        </div>
      </section>

      {/* Konten di atas kanvas */}
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-12">
        {pesan && (
          <div
            role="status"
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-card ${
              pesan.tipe === "sukses"
                ? "border-primary/30 bg-primary/10"
                : pesan.tipe === "peringatan"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                pesan.tipe === "sukses"
                  ? "bg-primary/15 text-primary"
                  : pesan.tipe === "peringatan"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {pesan.tipe === "sukses" ? "check_circle" : pesan.tipe === "peringatan" ? "warning" : "error"}
              </span>
            </span>
            <p
              className={`min-w-0 flex-1 pt-1 text-[13px] font-semibold leading-snug ${
                pesan.tipe === "sukses"
                  ? "text-primary-dark"
                  : pesan.tipe === "peringatan"
                  ? "text-amber-900"
                  : "text-red-800"
              }`}
            >
              {pesan.teks}
            </p>
            <button
              type="button"
              onClick={() => setPesan(null)}
              className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
              aria-label="Tutup pesan"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Dua kolom di desktop, satu kolom di mobile — komposisi seimbang */}
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Kolom kiri: formulir + zona. Di mobile memakai display:contents
              agar ketiga kartu bisa diurutkan: form → info/keamanan → zona */}
          <div className="contents lg:flex lg:flex-col lg:col-span-7 lg:gap-6">
          {/* Formulir informasi pribadi */}
          <form
            onSubmit={simpanProfil}
            className="order-1 rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:order-none lg:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[21px]">badge</span>
              </span>
              <div>
                <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                  Informasi Pribadi
                </h2>
                <p className="text-[11px] text-text-muted">
                  Perbarui data diri yang tampil di akun Anda
                </p>
              </div>
            </div>

            {/* Foto profil — unggah/ganti lewat file picker */}
            <div className="mb-5 flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border-subtle bg-surface-subtle text-xl font-bold text-primary lg:h-20 lg:w-20">
                {foto ? (
                  <img
                    src={foto}
                    alt="Foto profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  inisial
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text-primary">
                  Foto Profil
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-text-muted">
                  JPG/PNG/WebP, maks 2 MB.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => berkasFoto.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3.5 py-2 text-[11px] font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload</span>
                    Unggah Foto
                  </button>
                  {foto && (
                    <button
                      type="button"
                      onClick={hapusFoto}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Nama lengkap */}
              <div className="sm:col-span-2">
                <label htmlFor="profil-nama" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                  Nama lengkap
                </label>
                <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    id="profil-nama"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChangeForm}
                    placeholder="Contoh: Herman Wijaya"
                    maxLength={50}
                    required
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* Profesi */}
              <div>
                <label htmlFor="profil-profesi" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                  Profesi
                </label>
                <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">work</span>
                  </div>
                  <input
                    id="profil-profesi"
                    name="occupation"
                    type="text"
                    value={form.occupation}
                    onChange={handleChangeForm}
                    placeholder="Contoh: Driver"
                    maxLength={50}
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* Nomor telepon */}
              <div>
                <label htmlFor="profil-telepon" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                  Nomor telepon
                </label>
                <div className="relative rounded-2xl border border-border-subtle bg-surface-subtle transition-colors focus-within:border-accent-mint focus-within:bg-surface-card">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                  </div>
                  <input
                    id="profil-telepon"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChangeForm}
                    placeholder="08123456789"
                    required
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-text-muted">
                  Nomor ini dipakai untuk masuk.
                </p>
              </div>
            </div>

            {/* Aksi formulir */}
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-card px-5 py-3 text-[13px] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={menyimpan}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {menyimpan ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">save</span>
                )}
                {menyimpan ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </form>

          {/* Zona berbahaya — mobile: paling bawah; desktop: di bawah formulir */}
          <section className="order-3 flex flex-col gap-4 rounded-4xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between lg:order-none lg:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <span className="material-symbols-outlined text-[21px]">warning</span>
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold tracking-tight text-red-800">Hapus Akun</h2>
                <p className="mt-0.5 max-w-lg text-[12px] leading-snug text-red-700/90">
                  Menghapus akun akan menghilangkan seluruh riwayat shift,
                  konsultasi Ergo-Coach, dan pengingat kesehatan Anda secara
                  permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setModalHapus(true); setTeksKonfirmasi(""); setGalatHapus(""); }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-5 py-3 text-[13px] font-semibold text-red-700 shadow-xs transition-colors hover:bg-red-100"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Hapus Akun
            </button>
          </section>
          </div>

          {/* Info akun + keamanan */}
          <div className="order-2 flex flex-col gap-5 lg:order-none lg:col-span-5 lg:gap-6">
            {/* Info akun */}
            <section className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[21px]">info</span>
                </span>
                <h2 className="text-[15px] font-bold tracking-tight text-text-primary">
                  Info Akun
                </h2>
              </div>
              <dl className="divide-y divide-border-subtle text-[13px]">
                {user?.username && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-text-muted">Username</dt>
                    <dd className="font-medium text-text-primary">@{user.username}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-text-muted">Nomor telepon</dt>
                  <dd className="font-medium text-text-primary">{telepon}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-text-muted">Bergabung</dt>
                  <dd className="font-medium text-text-primary">{formatTanggal(user.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-text-muted">Status</dt>
                  <dd>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Aktif
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Keamanan */}
            <form onSubmit={gantiSandi} className="rounded-4xl border border-border-subtle bg-surface-card p-5 shadow-card lg:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[21px]">lock_reset</span>
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-text-primary">Keamanan</h2>
                    <p className="text-[11px] text-text-muted">Ubah kata sandi akun Anda</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLihatSandi((v) => !v)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:text-primary"
                  aria-label={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  title={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {lihatSandi ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="sandi-lama" className="mb-1.5 block text-[12px] font-medium text-text-muted">Kata sandi saat ini</label>
                  <input
                    id="sandi-lama"
                    name="lama"
                    type={lihatSandi ? "text" : "password"}
                    value={sandi.lama}
                    onChange={handleChangeSandi}
                    placeholder="Masukkan kata sandi saat ini"
                    required
                    className="w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/70 transition-colors focus:border-accent-mint focus:bg-surface-card focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="sandi-baru" className="mb-1.5 block text-[12px] font-medium text-text-muted">Kata sandi baru</label>
                  <input
                    id="sandi-baru"
                    name="baru"
                    type={lihatSandi ? "text" : "password"}
                    value={sandi.baru}
                    onChange={handleChangeSandi}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/70 transition-colors focus:border-accent-mint focus:bg-surface-card focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="sandi-konfirmasi" className="mb-1.5 block text-[12px] font-medium text-text-muted">Konfirmasi kata sandi baru</label>
                  <input
                    id="sandi-konfirmasi"
                    name="konfirmasi"
                    type={lihatSandi ? "text" : "password"}
                    value={sandi.konfirmasi}
                    onChange={handleChangeSandi}
                    placeholder="Ulangi kata sandi baru"
                    required
                    minLength={6}
                    className="w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/70 transition-colors focus:border-accent-mint focus:bg-surface-card focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={menggantiSandi}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-card px-5 py-3 text-[13px] font-semibold text-text-primary shadow-xs transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {menggantiSandi ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">key</span>
                )}
                {menggantiSandi ? "Memproses…" : "Ubah Kata Sandi"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Modal konfirmasi hapus akun */}
      {modalHapus && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-hapus"
            className="w-full max-w-md rounded-t-3xl bg-surface-card p-6 shadow-card sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <span className="material-symbols-outlined text-[22px]">delete_forever</span>
                </span>
                <h2 id="judul-hapus" className="text-lg font-bold tracking-tight text-text-primary">
                  Hapus akun permanen?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalHapus(false)}
                className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <ul className="mt-4 space-y-2 text-[13px] text-text-primary">
              {[
                "Seluruh riwayat shift & pendapatan dihapus.",
                "Riwayat konsultasi Ergo-Coach AI dihapus.",
                "Pengingat kesehatan ikut dihapus.",
              ].map((butir) => (
                <li key={butir} className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-red-500">check</span>
                  <span>{butir}</span>
                </li>
              ))}
            </ul>

            <label htmlFor="konfirmasi-hapus" className="mt-4 block text-[12px] font-medium text-text-muted">
              Ketik <span className="font-bold text-red-600">HAPUS</span> untuk mengonfirmasi
            </label>
            <input
              id="konfirmasi-hapus"
              type="text"
              value={teksKonfirmasi}
              onChange={(e) => setTeksKonfirmasi(e.target.value)}
              placeholder="HAPUS"
              autoComplete="off"
              className="mt-1.5 w-full rounded-2xl border border-border-subtle bg-surface-subtle px-4 py-3 text-sm font-semibold tracking-wide text-text-primary placeholder:text-text-muted/60 transition-colors focus:border-red-300 focus:bg-surface-card focus:outline-none"
            />

            {galatHapus && (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium leading-snug text-red-800">
                {galatHapus}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setModalHapus(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-subtle px-5 py-3 text-[13px] font-semibold text-text-muted transition-colors hover:text-text-primary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={hapusAkun}
                disabled={teksKonfirmasi !== "HAPUS" || menghapus}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {menghapus && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {menghapus ? "Menghapus…" : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default ProfilePage;

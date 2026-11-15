// ============================================================
// client/src/pages/Chat/components/EmergencyBanner.jsx
// Banner PERINGATAN DARURAT + tombol 119 (Milik P2, Minggu 4).
// Muncul saat keluhan user memuat red flag ("nyeri dada", dst).
// Wajib: nomor 119 jelas, tombol telepon, dan jalan menuju Faskes.
// Warna merah dipakai murni sebagai makna darurat (bukan dekorasi):
// satu bidang merah solid, tanpa gradien atau efek glow.
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

const EmergencyBanner = ({ keywords = [], onDismiss }) => {
  return (
    <div
      role="alert"
      className="overflow-hidden rounded-3xl bg-red-600 text-white shadow-card"
    >
      <div className="flex gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <span className="material-symbols-outlined text-[22px] text-white">warning</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold tracking-wide uppercase">
              Peringatan darurat
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup peringatan"
                className="ml-auto rounded-full p-1 transition-colors hover:bg-white/15"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-red-50">
            Keluhan Anda{" "}
            {keywords.length > 0 && (
              <span className="font-bold text-white">
                ({keywords.map((k) => `“${k}”`).join(", ")}){" "}
              </span>
            )}
            bisa menjadi tanda kondisi serius. Jangan menunda — lakukan ini sekarang:
          </p>

          <ul className="mt-2 space-y-1 text-[13px] text-white/95">
            <li className="flex gap-2">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">
                front_hand
              </span>
              Berhenti bekerja, berhenti di tempat aman
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">
                group
              </span>
              Minta bantuan orang di sekitar Anda
            </li>
          </ul>
        </div>
      </div>

      {/* Baris aksi: 119 & faskes terdekat */}
      <div className="flex flex-wrap items-center gap-2 bg-black/15 px-4 py-3">
        <a
          href="tel:119"
          className="tombol-119 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
          Hubungi 119
        </a>
        <Link
          to="/finder"
          className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          Faskes Terdekat
        </Link>
        <p className="ml-auto hidden text-right text-[11px] text-red-100 sm:block">
          Panggilan 119 gratis,
          <br />
          tersedia 24 jam
        </p>
      </div>
    </div>
  );
};

export default EmergencyBanner;

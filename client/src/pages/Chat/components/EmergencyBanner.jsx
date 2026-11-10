// ============================================================
// client/src/pages/Chat/components/EmergencyBanner.jsx
// Banner PERINGATAN DARURAT + tombol 119 (Milik P2, Minggu 4).
// Muncul saat keluhan user memuat red flag ("nyeri dada", dst).
// Wajib: nomor 119 jelas, tombol telepon, dan jalan menuju Faskes.
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

const EmergencyBanner = ({ keywords = [], onDismiss }) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border-2 border-red-300 bg-gradient-to-b from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 overflow-hidden"
    >
      <div className="p-4 flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[24px] animate-pulse">
            warning
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-extrabold tracking-wider uppercase">
              Peringatan Darurat
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup peringatan"
                className="ml-auto p-1 rounded-full hover:bg-white/15 transition-colors"
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
            bisa menjadi tanda kondisi serius. Jangan menunda — lakukan ini
            sekarang:
          </p>

          <ul className="mt-2 space-y-1 text-[13px] text-white/95">
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">
                front_hand
              </span>
              Berhenti bekerja, berhenti di tempat aman
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">
                group
              </span>
              Minta bantuan orang di sekitar Anda
            </li>
          </ul>
        </div>
      </div>

      {/* Baris aksi: 119 & Faskes terdekat */}
      <div className="flex items-center gap-2 px-4 py-3 bg-black/15">
        <a
          href="tel:119"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-red-700 shadow-sm transition-transform hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
          Hubungi 119
        </a>
        <Link
          to="/finder"
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">
            local_hospital
          </span>
          Faskes Terdekat
        </Link>
        <p className="ml-auto hidden sm:block text-[11px] text-red-100 text-right">
          Panggilan 119 gratis,
          <br />
          tersedia 24 jam
        </p>
      </div>
    </div>
  );
};

export default EmergencyBanner;

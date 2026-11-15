// ============================================================
// client/src/components/Layout/Footer.jsx
// Footer minimalis desktop (disembunyikan di mobile agar ruang
// layar tetap lega untuk dock navigasi).
// ============================================================
import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="relative z-10 mt-10 hidden w-full border-t border-border-subtle bg-surface-card py-6 lg:block">
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-12 text-xs text-text-muted sm:flex-row">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-primary">VITARA</span>
        <span>— Platform Kebugaran &amp; Ritme Kerja Mitra</span>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/reminder" className="transition-colors hover:text-text-primary">
          Pengingat
        </Link>
        <Link to="/chat" className="transition-colors hover:text-text-primary">
          Standar Ergonomi
        </Link>
        <Link to="/finder" className="transition-colors hover:text-text-primary">
          Faskes Mitra
        </Link>
        <a href="tel:119" className="font-semibold text-status-alert hover:underline">
          Darurat 119
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;

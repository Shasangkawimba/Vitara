// ============================================================
// client/src/components/Layout/Sidebar.jsx
// Navigasi samping desktop (lg ke atas). Pola visual mengikuti
// kartu Stitch/Dribbble: item aktif berupa pil pine penuh,
// item pasif tenang dengan hover lembut.
// ============================================================
import React from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";

export const Sidebar = () => {
  return (
    <aside
      aria-label="Navigasi Samping VITARA"
      className="hidden lg:flex fixed left-0 top-14 bottom-0 z-30 w-60 flex-col border-r border-border-subtle bg-white"
    >
      {/* Daftar menu utama */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-soft">
          Menu
        </p>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary font-semibold text-white shadow-soft"
                    : "font-medium text-text-muted hover:bg-surface-muted hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[20px] shrink-0"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {item.ikon}
                  </span>
                  <span className="truncate">{item.labelPanjang}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bantuan & kontak darurat */}
      <div className="border-t border-border-subtle px-3 py-3">
        <a
          href="tel:119"
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          <span>
            Kontak Darurat <span className="font-bold">119</span>
          </span>
        </a>
        <p className="px-3 pt-2 text-[10px] leading-relaxed text-text-soft">
          &copy; 2026 VITARA Gig Worker
          <br />Health &amp; Welfare System
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

// ============================================================
// client/src/components/Layout/BottomNav.jsx
// Floating island navigation dock (mobile) — 4 tab gaya Telegram:
// ikon + label 1 kata di bawahnya. Tab aktif dapat bubble putih
// lembut (persis sorotan tab pada Telegram).
// ============================================================
import React from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";

export const BottomNav = () => {
  return (
    <nav
      aria-label="Navigasi Bawah VITARA"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center pb-safe pointer-events-none lg:hidden"
    >
      <div className="pointer-events-auto flex h-[68px] items-center gap-1 rounded-full border border-white/10 bg-primary px-2 shadow-dock">
        {NAV_ITEMS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            aria-label={tab.labelPanjang}
            title={tab.labelPanjang}
            className={({ isActive }) =>
              `flex min-w-[58px] flex-col items-center justify-center gap-[3px] rounded-2xl px-3 py-2 transition-all ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:text-white active:scale-95"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  aria-hidden="true"
                >
                  {tab.ikon}
                </span>
                <span className="text-[10px] font-semibold leading-none tracking-wide">
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

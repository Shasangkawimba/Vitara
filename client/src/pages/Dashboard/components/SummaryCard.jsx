// ============================================================
// client/src/pages/Dashboard/components/SummaryCard.jsx
// Komponen Card Metrik Ringkasan untuk Dashboard VITARA
// Dibuat oleh P3 (Dashboard & Layout Shell)
// Gaya mengikuti kartu Stitch: radius besar, shadow lembut,
// angka besar, tanpa badge warna-warni.
// ============================================================
import React from "react";

export const SummaryCard = ({
  judul,
  nilai,
  subtext,
  icon,
  badgeText,
  loading = false,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-soft">
          {judul}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[18px] text-text-soft">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="my-1 h-8 w-28 animate-pulse rounded-md bg-surface-muted" />
        ) : (
          <div className="text-[28px] font-bold leading-none tracking-tight text-text-main">
            {nilai}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
        <p className="text-[11px] text-text-soft">{subtext}</p>
        {badgeText && !loading && (
          <span className="text-[11px] font-semibold text-text-main">{badgeText}</span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;

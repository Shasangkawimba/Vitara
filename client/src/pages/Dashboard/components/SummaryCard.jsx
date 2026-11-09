// ============================================================
// client/src/pages/Dashboard/components/SummaryCard.jsx
// Komponen Card Metrik Ringkasan untuk Dashboard VITARA
// Dibuat oleh P3 (Dashboard & Layout Shell)
// ============================================================
import React from "react";

export const SummaryCard = ({
  judul,
  nilai,
  subtext,
  icon,
  badgeText,
  badgeType = "info", // "success", "warning", "danger", "info"
  loading = false,
}) => {
  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {judul}
        </span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-md bg-slate-200 my-1"></div>
        ) : (
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {nilai}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {subtext}
        </p>
        {badgeText && !loading && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              badgeStyles[badgeType] || badgeStyles.info
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;

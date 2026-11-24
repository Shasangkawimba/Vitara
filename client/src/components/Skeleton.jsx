// ============================================================
// client/src/components/Skeleton.jsx
// Placeholder muat yang konsisten di seluruh halaman.
// ============================================================
import React from "react";

export default function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-subtle ${className}`}
    />
  );
}

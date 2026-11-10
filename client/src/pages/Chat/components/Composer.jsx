// ============================================================
// client/src/pages/Chat/components/Composer.jsx
// Kolom input pesan Chat (gaya rounded pill seperti desain Stitch).
// Enter = kirim, Shift+Enter = baris baru.
// ============================================================
import React, { useRef } from "react";

const Composer = ({ nilai, onChange, onSend, loading }) => {
  const inputRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const bisaKirim = nilai.trim().length >= 3 && !loading;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 flex items-end gap-1 rounded-2xl border border-border-subtle bg-white px-2 py-1.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
        <button
          type="button"
          title="Lampirkan foto (segera hadir)"
          className="material-symbols-outlined text-text-soft hover:text-primary text-[20px] p-1.5 rounded-full transition-colors"
          disabled
        >
          photo_camera
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          value={nilai}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ceritakan keluhan Anda setelah bekerja…"
          className="flex-1 resize-none bg-transparent px-1 py-2 text-sm text-text-main placeholder:text-text-soft focus:outline-none max-h-32"
          maxLength={1000}
        />

        <button
          type="button"
          title="Pesan suara (segera hadir)"
          className="material-symbols-outlined text-text-soft hover:text-primary text-[20px] p-1.5 rounded-full transition-colors"
          disabled
        >
          mic
        </button>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!bisaKirim}
        aria-label="Kirim pesan"
        className="w-11 h-11 shrink-0 rounded-full bg-primary text-white flex items-center justify-center shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="material-symbols-outlined text-[20px] animate-spin">
            progress_activity
          </span>
        ) : (
          <span className="material-symbols-outlined text-[20px]">send</span>
        )}
      </button>
    </div>
  );
};

export default Composer;

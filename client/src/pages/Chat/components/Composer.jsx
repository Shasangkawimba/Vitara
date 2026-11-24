// ============================================================
// client/src/pages/Chat/components/Composer.jsx
// Kolom input Ergo-Coach — satu pil utuh (lampiran, teks, mic,
// kirim) mengikuti komponen input pada desain Stitch.
// Enter = kirim, Shift+Enter = baris baru.
// Mic memakai Web Speech API; transkrip masuk ke kolom teks.
// ============================================================
import React, { useEffect, useRef, useState } from "react";

const Composer = ({ nilai, onChange, onSend, loading }) => {
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [mencatat, setMencatat] = useState(false);
  const [didukung, setDidukung] = useState(true);
  const [micError, setMicError] = useState("");

  // Hapus instance SpeechRecognition saat komponen dibuang.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    // Hentikan rekaman yang sedang jalan.
    if (mencatat) {
      recognitionRef.current?.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setDidukung(false);
      setMicError(
        "Browser tidak mendukung input suara. Gunakan Chrome atau Edge."
      );
      return;
    }

    setMicError("");
    try {
      const recognition = new SR();
      recognition.lang = "id-ID";
      recognition.continuous = true; // Bisa menyebut beberapa keluhan sekaligus
      recognition.interimResults = true;

      recognition.onstart = () => setMencatat(true);

      recognition.onresult = (event) => {
        let teksFinal = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const hasil = event.results[i];
          if (hasil.isFinal) {
            teksFinal += hasil[0].transcript;
          }
        }
        if (teksFinal.trim()) {
          // Sambungkan ke isi kolom yang sudah ada.
          onChange((prev) =>
            prev ? `${prev.trimEnd()} ${teksFinal.trim()}` : teksFinal.trim()
          );
        }
      };

      recognition.onerror = (event) => {
        const petaError = {
          "not-allowed": "Izin mikrofon ditolak. Izinkan akses mic di browser.",
          "no-speech": "Tidak ada suara terdeteksi. Coba lagi lebih dekat ke mic.",
          network: "Jaringan bermasalah saat memproses suara (butuh internet).",
          "audio-capture": "Mikrofon tidak terdeteksi pada perangkat Anda.",
          "language-not-supported": "Bahasa Indonesia tidak didukung browser ini.",
        };
        setMicError(petaError[event.error] || `Gagal mengenali suara (${event.error}).`);
      };

      recognition.onend = () => setMencatat(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Gagal memulai pengenalan suara:", err);
      setMicError("Gagal mengaktifkan mikrofon. Coba lagi.");
      setMencatat(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const bisaKirim = nilai.trim().length >= 3 && !loading;

  // Auto-grow: tinggi textarea mengikuti isi (maks 5 baris), lalu scroll internal.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [nilai]);

  return (
    <div>
      <div className="flex items-end gap-1 rounded-[24px] border border-border-subtle bg-surface-subtle p-1 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all focus-within:border-accent-mint/45 focus-within:bg-surface-card">
        <button
          type="button"
          title="Lampirkan foto (segera hadir)"
          aria-label="Lampirkan foto"
          className="material-symbols-outlined shrink-0 rounded-full p-1.5 text-[20px] text-text-muted transition-colors hover:text-primary"
          disabled
        >
          attach_file
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          value={nilai}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mencatat ? "Mendengarkan suara…" : "Tanya keluhan fisik…"
          }
          className={`max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-5 text-text-primary placeholder:text-text-muted focus:outline-none ${
            micError ? "placeholder:text-red-500" : ""
          }`}
          maxLength={1000}
        />

        {/* Tombol mic: aktif mendengarkan bila didukung browser */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!didukung}
          aria-label={mencatat ? "Hentikan rekaman suara" : "Mulai rekaman suara"}
          title={
            !didukung
              ? "Browser tidak mendukung input suara"
              : mencatat
              ? "Klik untuk berhenti mendengarkan"
              : "Klik untuk bicara (transkrip masuk ke kolom teks)"
          }
          className={`relative material-symbols-outlined shrink-0 rounded-full p-1.5 text-[20px] transition-colors ${
            !didukung
              ? "cursor-not-allowed text-text-muted/40"
              : mencatat
              ? "animate-pulse text-red-600 hover:text-red-700"
              : "text-text-muted hover:text-primary"
          }`}
        >
          mic
          {mencatat && (
            <span className="absolute inset-1 animate-ping rounded-full ring-2 ring-red-500/60" />
          )}
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!bisaKirim}
          aria-label="Kirim pesan"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-xs transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[19px]">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[19px]">send</span>
          )}
        </button>
      </div>

      {/* Status mic ringkas di bawah pil */}
      {(mencatat || micError) && (
        <p
          className={`px-3 pt-1.5 text-[10px] font-medium ${
            micError ? "text-red-600" : "text-primary"
          }`}
        >
          {micError ||
            "Mendengarkan suara Anda… transkrip masuk ke kolom. Klik mic untuk berhenti."}
        </p>
      )}
    </div>
  );
};

export default Composer;

// ============================================================
// client/src/pages/Chat/components/Composer.jsx
// Kolom input pesan Chat (gaya rounded pill seperti desain Stitch).
// Enter = kirim, Shift+Enter = baris baru.
// Mic akan aktif memakai Web Speech API (SpeechRecognition),
// transkrip dimasukkan ke kolom teks; keputusan tunda di user.
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
      recognition.continuous = true; // Bisa mentyebut beberapa keluhan sekaligus
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
          // Sambungkan ke isi kolom yang sudah ada, angka besar bila perlu.
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

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-1 rounded-2xl border border-border-subtle bg-white px-2 py-1.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
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
            placeholder={
              mencatat
                ? "Mendengarkan suara Anda… bicara sekarang"
                : "Ceritakan keluhan Anda setelah bekerja…"
            }
            className={`flex-1 resize-none bg-transparent px-1 py-2 text-sm text-text-main placeholder:text-text-soft focus:outline-none max-h-32 ${
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
            className={`relative material-symbols-outlined text-[20px] p-1.5 rounded-full transition-colors ${
              !didukung
                ? "text-text-soft/40 cursor-not-allowed"
                : mencatat
                ? "text-red-600 animate-pulse hover:text-red-700"
                : "text-text-soft hover:text-primary"
            }`}
          >
            mic
            {mencatat && (
              <span className="absolute inset-1 rounded-full ring-2 ring-red-500/60 animate-ping" />
            )}
          </button>
        </div>

        {/* Status mic ringkas di bawah pill */}
        {(mencatat || micError) && (
          <p
            className={`px-2 pt-1 text-[10px] font-medium ${
              micError ? "text-red-600" : "text-primary"
            }`}
          >
            {micError ||
              "Mendengarkan suara Anda… transkrip akan masuk ke kolom. Klik mic untuk berhenti."}
          </p>
        )}
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

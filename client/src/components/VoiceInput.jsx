import React, { useState, useEffect, useRef } from 'react';

/**
 * Komponen VoiceInput
 * 
 * Komponen input suara menggunakan Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Dirancang untuk digunakan ulang (reusable), misalnya di halaman Logger oleh P1.
 * 
 * @param {Object} props
 * @param {Function} props.onResult - Callback yang dipanggil saat transkrip suara berhasil diperoleh: onResult(text)
 * @param {Function} [props.onError] - Callback opsional ketika terjadi error: onError(errorMessage)
 * @param {string} [props.className] - Class Tailwind tambahan untuk container
 * @param {string} [props.buttonClassName] - Class Tailwind tambahan untuk tombol mikrofon
 * @param {boolean} [props.showStatus=true] - Menampilkan status teks interaktif (Mendengarkan, Siap, dll.)
 * @param {string} [props.lang='id-ID'] - Bahasa pengenalan suara (default Bahasa Indonesia)
 * @param {boolean} [props.disabled=false] - Menonaktifkan tombol
 */
const VoiceInput = ({
  onResult,
  onError,
  className = '',
  buttonClassName = '',
  showStatus = true,
  lang = 'id-ID',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  // Inisialisasi Web Speech API saat komponen dimuat
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      const unsupportedMsg = 'Browser Anda tidak mendukung fitur input suara (Web Speech API).';
      setErrorMessage(unsupportedMsg);
      if (onError) onError(unsupportedMsg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Berhenti otomatis setelah satu kalimat selesai
    recognition.interimResults = false; // Hanya ambil hasil final
    recognition.lang = lang;

    // Saat proses mendengarkan dimulai
    recognition.onstart = () => {
      setIsListening(true);
      setStatusText('Mendengarkan suara Anda...');
      setErrorMessage('');
    };

    // Saat menerima hasil suara
    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        setStatusText('Suara berhasil direkam.');
        if (onResult) {
          onResult(finalTranscript.trim());
        }
      }
    };

    // Saat terjadi error pada Web Speech API
    recognition.onerror = (event) => {
      let errorDesc = 'Terjadi kesalahan pada input suara.';

      switch (event.error) {
        case 'not-allowed':
          errorDesc = 'Izin akses mikrofon ditolak. Harap izinkan akses mikrofon di browser.';
          break;
        case 'no-speech':
          errorDesc = 'Tidak ada suara yang terdeteksi. Silakan coba lagi.';
          break;
        case 'network':
          errorDesc = 'Koneksi jaringan bermasalah saat memproses suara.';
          break;
        case 'audio-capture':
          errorDesc = 'Mikrofon tidak terdeteksi pada perangkat Anda.';
          break;
        default:
          errorDesc = `Gagal mengenali suara (${event.error}).`;
      }

      setErrorMessage(errorDesc);
      setStatusText('');
      if (onError) onError(errorDesc);
    };

    // Saat proses mendengarkan selesai
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Bersihkan saat unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onResult, onError]);

  // Fungsi toggle mulai / berhenti mendengarkan
  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setErrorMessage('');
      setStatusText('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Gagal memulai pengenalan suara:', err);
      }
    }
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      {/* Tombol Mikrofon */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={!isSupported || disabled}
        aria-label={isListening ? 'Hentikan rekaman suara' : 'Mulai rekaman suara'}
        title={
          !isSupported
            ? 'Browser tidak mendukung input suara'
            : isListening
            ? 'Klik untuk berhenti mendengarkan'
            : 'Klik untuk bicara'
        }
        className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          !isSupported || disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : isListening
            ? 'bg-red-600 text-white shadow-lg shadow-red-500/50 scale-105 animate-pulse focus:ring-red-500'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg focus:ring-emerald-500'
        } ${buttonClassName}`}
      >
        {/* Ikon Mikrofon SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          {isListening ? (
            // Ikon Kotak (Stop) saat sedang mendengarkan
            <path
              fillRule="evenodd"
              d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
              clipRule="evenodd"
            />
          ) : (
            // Ikon Mic saat standby
            <>
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </>
          )}
        </svg>

        {/* Gelombang animasi efek pulsa saat aktif */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping -z-10" />
        )}
      </button>

      {/* Teks Status / Pesan Error */}
      {showStatus && (
        <div className="text-xs text-center min-h-[1.25rem]">
          {errorMessage ? (
            <p className="text-red-600 font-medium">{errorMessage}</p>
          ) : isListening ? (
            <p className="text-red-600 font-medium flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              Mendengarkan... Bicara sekarang
            </p>
          ) : statusText ? (
            <p className="text-emerald-600">{statusText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

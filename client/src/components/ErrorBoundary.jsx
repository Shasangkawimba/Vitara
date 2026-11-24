// ============================================================
// client/src/components/ErrorBoundary.jsx
// Menangkap error render React agar seluruh aplikasi tidak
// menjadi layar putih. Menampilkan pesan ramah + tombol muat ulang.
// ============================================================
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { galat: null };
  }

  static getDerivedStateFromError(galat) {
    return { galat };
  }

  componentDidCatch(galat, info) {
    console.error("[ErrorBoundary]", galat, info);
  }

  render() {
    if (this.state.galat) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-tekstur-kanvas px-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-primary">
            sentiment_dissatisfied
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-text-primary">
            Terjadi kesalahan pada halaman
          </h1>
          <p className="mt-2 max-w-sm text-sm text-text-muted">
            Silakan muat ulang halaman. Jika masalah berlanjut, kembali ke
            Dashboard lalu coba lagi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Muat Ulang
            </button>
            <a
              href="/dashboard"
              className="rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
            >
              Ke Dashboard
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

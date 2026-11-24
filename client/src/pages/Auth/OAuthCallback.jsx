// ============================================================
// client/src/pages/Auth/OAuthCallback.jsx
// Halaman penerima redirect Google. Menukar kode sekali pakai
// dari backend menjadi JWT, lalu meneruskan user ke Logger.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [galat, setGalat] = useState("");
  const sudahDiproses = useRef(false);

  useEffect(() => {
    // React StrictMode menjalankan effect dua kali: kode sekali pakai
    // hanya boleh ditukar sekali.
    if (sudahDiproses.current) return;
    sudahDiproses.current = true;

    const params = new URLSearchParams(window.location.search);
    const pesanGalat = params.get("error");
    const kode = params.get("code");

    if (pesanGalat) {
      setGalat(pesanGalat);
      return;
    }
    if (!kode) {
      setGalat("Kode masuk Google tidak ditemukan. Silakan ulangi.");
      return;
    }

    api
      .post("/api/auth/oauth/exchange", { code: kode })
      .then((respons) => {
        const data = respons.data?.data;
        if (!respons.data?.success || !data?.user) {
          throw new Error(respons.data?.error || "Gagal masuk dengan Google.");
        }
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("vitara-user-changed"));
        navigate("/logger", { replace: true });
      })
      .catch((err) => {
        setGalat(
          err.response?.data?.error ||
            err.message ||
            "Gagal masuk dengan Google. Silakan coba lagi."
        );
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-tekstur-kanvas px-5">
      <div className="w-full max-w-md rounded-4xl border border-border-subtle bg-surface-card p-7 text-center shadow-card">
        {galat ? (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <span className="material-symbols-outlined text-[24px]">error</span>
            </span>
            <h1 className="mt-4 text-lg font-bold tracking-tight text-text-primary">
              Gagal masuk dengan Google
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{galat}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke halaman masuk
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined animate-spin text-[24px]">
                progress_activity
              </span>
            </span>
            <h1 className="mt-4 text-lg font-bold tracking-tight text-text-primary">
              Menyelesaikan masuk…
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Sebentar, kami menyiapkan akun VITARA Anda.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

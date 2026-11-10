// ============================================================
// App.jsx — MILIK P3. Anggota lain DILARANG mengedit file ini
// (lihat AGENTS.md aturan emas no. 3). Untuk sementara tiap
// route memakai placeholder; pemilik halaman mengganti placeholder
// dengan halamannya sendiri lewat PR ke main, dan P3 yang memasang
// import halamannya di file ini.
// ============================================================
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Auth";
import Logger from "./pages/Logger";

// Placeholder sementara — akan diganti halaman asli milik masing-masing P.
const Placeholder = ({ nama, pemilik }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">{nama}</h1>
      <p className="mt-2 text-sm text-slate-500">
        Belum diimplementasikan — milik {pemilik}.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Path sesuai pembagian tugas di README: P1–P4 */}
      <Route path="/" element={<Logger />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/logger" element={<Logger />} />
      <Route path="/chat" element={<Placeholder nama="Chat Ergo-Coach AI" pemilik="P2" />} />
      <Route path="/dashboard" element={<Placeholder nama="Dashboard" pemilik="P3" />} />
      <Route path="/finder" element={<Placeholder nama="Finder Kesehatan" pemilik="P4" />} />
      {/* TODO P3: 404 / catch-all route */}
    </Routes>
  );
}

export default App;

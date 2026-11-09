// ============================================================
// client/src/components/Layout/index.jsx
// Layout Shell Utama aplikasi VITARA (Navbar & Sidebar Shell)
// Dikelola secara penuh oleh P3 (lihat aturan AGENTS.md & P3_PRIVATE.md)
// ============================================================
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * Komponen Layout Shell Utama
 * Membungkus semua halaman utama (Dashboard, Logger, Chat, Finder, Reminder)
 * Mendukung baik penggunaan rute bersarang (<Outlet />) maupun child langsung ({children})
 */
export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigasi */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Konten Utama Kanan (Navbar + Area Halaman) */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Navbar Bagian Atas */}
        <Navbar onToggleSidebar={toggleSidebar} />

        {/* Kontainer Isi Halaman */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Ekspor bernama untuk kebutuhan khusus & ekspor default untuk Layout wrapper
export { Navbar } from "./Navbar";
export { Sidebar } from "./Sidebar";
export default Layout;

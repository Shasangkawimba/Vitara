// ============================================================
// client/src/components/Layout/index.jsx
// Layout Shell Utama VITARA
// Mendukung toggle buka/tutup (collapse) Sidebar dari tombol hamburger
// ============================================================
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import SubNavbar from "./SubNavbar";

export const Layout = ({ children }) => {
  // Default terbuka di layar desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef3f6] dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Header Bagian Paling Atas (Full Width) */}
      <Navbar />

      {/* 2. Body Layout Tengah: Sidebar + Main Workspace */}
      <div className="flex flex-1 gap-5 p-4 sm:p-5 min-w-0">
        {/* Floating Sidebar (Kiri) */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Konten Kanan: SubNavbar + Kontainer Halaman */}
        <div className="flex flex-1 flex-col gap-4 min-w-0 transition-all duration-300">
          {/* SubNavbar (Tombol Hamburger Garis Tiga, Judul Halaman & Breadcrumb) */}
          <SubNavbar onToggleSidebar={toggleSidebar} />

          {/* Area Konten Utama Halaman (Putih Melengkung) */}
          <main className="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs overflow-y-auto transition-colors duration-200">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* 3. Footer Bagian Paling Bawah (Bentuk Mirip Header, Teks di Center) */}
      <footer className="w-full border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 transition-colors duration-200">
        <div className="flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; 2024 VITARA Driver Ergonomics &amp; Health System &bull; Panduan K3 &bull; Pusat Bantuan &bull; call Darurat Medis 119
          </p>
        </div>
      </footer>
    </div>
  );
};

export { Navbar } from "./Navbar";
export { Sidebar } from "./Sidebar";
export { SubNavbar } from "./SubNavbar";
export default Layout;

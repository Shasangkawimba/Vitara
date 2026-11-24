// ============================================================
// client/src/components/Layout/index.jsx
// Layout shell VITARA — tanpa sidebar, mengikuti Stitch:
//   • Navbar dengan floating dock di desktop
//   • Hero gradient pine selebar layar untuk Dashboard & Logger
//   • Konten halaman mengatur kolom & padding-nya sendiri
//   • Footer desktop + floating bottom dock di mobile
// ============================================================
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import { startReminderScheduler } from "../../services/reminderScheduler";
import { registerServiceWorker } from "../../services/pushService";

const HALAMAN_GELAP = ["/dashboard", "/logger", "/chat", "/finder", "/profile", "/reminder"];

export const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const gelap = HALAMAN_GELAP.some((path) => pathname.startsWith(path));

  // Scheduler pengingat global: alarm tetap berbunyi di halaman mana pun
  // selama cache profil pengguna masih ada.
  useEffect(() => {
    registerServiceWorker();
    if (!localStorage.getItem("user")) return;
    return startReminderScheduler();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-tekstur-kanvas text-text-primary transition-colors duration-200">
      {/* Hero band gelap yang memudar ke kanvas */}
      {gelap && (
        <div
          aria-hidden="true"
          className="hero-gradient pointer-events-none absolute inset-x-0 top-0 h-[440px]"
        />
      )}

      <Navbar />

      <main className="relative z-10 flex w-full flex-1 flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children || <Outlet />}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export { Navbar } from "./Navbar";
export { default as BottomNav } from "./BottomNav";
export { default as Footer } from "./Footer";
export default Layout;

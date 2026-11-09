import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Konfig Vite untuk client VITARA.
// Proxy /api → server Express (port 5001) agar tidak ribet CORS saat dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});

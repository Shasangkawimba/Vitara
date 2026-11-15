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
        // Jaga-jaga saat backend di-restart oleh node --watch (hot-reload):
        // browser tetap menerima JSON error rapi, bukan koneksi putus mentah.
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            console.warn(
              `[vite] Backend sedang restart / tidak merespons (${err.code || err.message}). Tunggu 1-2 detik lalu coba lagi.`
            );
            try {
              if (res && !res.headersSent) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: "Server backend sedang restart. Tunggu sesaat lalu coba lagi.",
                  })
                );
              }
            } catch {
              // Respons sudah terkirim sebagian — tidak ada lagi yang bisa dilakukan.
            }
          });
        },
      },
    },
  },
});

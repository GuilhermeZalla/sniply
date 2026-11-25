import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target:
          loadEnv(mode, process.cwd(), "").API_PROXY || "http://127.0.0.1:5088",
        changeOrigin: false,
      },
    },
  },
}));

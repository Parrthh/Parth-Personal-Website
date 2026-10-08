import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // During local development, send form submissions to the deployed API.
    proxy: {
      "/api": { target: "https://parthkharkar.com", changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ["three", "@react-three/fiber"] } },
    },
  },
});

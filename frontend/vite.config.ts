import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const raw = (env.VITE_SITE_URL ?? "").trim();
  const siteUrl = raw.replace(/\/$/, "");

  return {
    plugins: [
      react(),
      {
        name: "html-site-url",
        transformIndexHtml(html) {
          const origin = siteUrl || "http://localhost:5173";
          return html.replaceAll("__META_SITE_URL__", origin);
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});

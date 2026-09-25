import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// VITE_* config comes from SSM (/ujto/<env>/web) through the process env: the root
// reboot-server.sh locally, scripts/load-env-from-ssm.sh --github-env in CI.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    // One React for the app and the design system.
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "wouter", "@tanstack/react-query"],
          amplify: ["aws-amplify", "aws-amplify/auth"],
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});

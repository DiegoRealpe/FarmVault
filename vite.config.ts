import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("aws-amplify")) {
            return "amplify";
          }

          if (id.includes("@aws-sdk")) {
            return "aws-sdk";
          }

          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("node_modules/@reduxjs") ||
            id.includes("node_modules/react-redux")
          ) {
            return "redux";
          }
        },
      },
    },
  },
});
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the built site from /Parsnip/, but local dev
  // should stay at the root. Note: `vite preview` resolves with the same
  // command ("serve") as `vite dev`, so we key off `mode` instead — both
  // `build` and `preview` run in "production" mode, while `dev` runs in
  // "development".
  base: mode === "production" ? "/Parsnip/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setupTests.ts"],
    // In addition to console output, write a JSON results file that
    // public/tests/index.html renders as a browsable pass/fail report
    // (linked from the app's toolbar). It's written under public/ so it
    // ships as part of the built site.
    reporters: ["default", "json"],
    outputFile: {
      json: "./public/tests/results.json",
    },
  },
}));

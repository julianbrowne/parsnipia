import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => ({
  // The custom domain (parsnipia.com, via public/CNAME) always serves
  // docs/ from its own root, regardless of this repo's name — unlike
  // the project-page URL (https://julianbrowne.github.io/parsnipia/),
  // which only exists because GitHub Pages prefixes project sites with
  // the repo name. Since both URLs serve the exact same built files,
  // base has to match whichever one is actually root: once a custom
  // domain is configured, GitHub Pages auto-redirects the github.io
  // project URL to it (dropping the /parsnipia/ prefix in the process),
  // so root ("/") is correct for both in practice.
  base: "/",
  // GitHub Pages' "deploy from a branch" mode can only serve from the
  // repo root or /docs — build straight into docs/ so a plain push
  // deploys, no build step required on GitHub's side.
  build: {
    outDir: "docs",
    rollupOptions: {
      // Multi-page build: the About and Tests pages are their own real
      // React pages (see about/index.html + src/About/, and
      // tests/index.html + src/TestResults/), not hand-written static
      // files, so each needs its own entry point alongside the main
      // app. Vite preserves each input's path under outDir, so these
      // still build to docs/about/index.html and docs/tests/index.html
      // as before.
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
        tests: resolve(import.meta.dirname, "tests/index.html"),
      },
    },
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setupTests.ts"],
    // In addition to console output, write a JSON results file that the
    // Tests page (src/TestResults/) fetches at runtime and renders as a
    // browsable pass/fail report (linked from the app's toolbar). It's
    // written under public/ so it ships as part of the built site.
    reporters: ["default", "json"],
    outputFile: {
      json: "./public/tests/results.json",
    },
  },
}));

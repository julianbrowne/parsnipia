import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * About and Tests are routed client-side (see src/Router/), so there's
 * only ever one real HTML file — but GitHub Pages' static file server
 * has no idea about that: a direct visit or refresh on /about or /tests
 * would just 404, since no such file exists. Copying the built
 * index.html to 404.html is the standard workaround for static SPA
 * hosts with a configurable 404 page: GitHub Pages serves it for any
 * unmatched path, the app boots exactly as it would from "/", and the
 * router then reads the actual URL and shows the right page.
 */
function spaFallback404(): Plugin {
  return {
    name: "spa-fallback-404",
    apply: "build",
    closeBundle: async () => {
      const outDir = resolve(import.meta.dirname, "docs");
      await copyFile(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

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
  },
  plugins: [react(), spaFallback404()],
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

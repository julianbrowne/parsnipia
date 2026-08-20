import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react's auto-cleanup only registers itself when it can
// see a global `afterEach`, which we don't enable (see vite.config.ts) —
// so wire it up explicitly to unmount components between tests.
afterEach(() => {
  cleanup();
});

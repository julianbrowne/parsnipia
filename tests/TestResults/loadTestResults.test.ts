import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { loadTestResults, relativePath } from "../../src/TestResults/loadTestResults";

describe("relativePath", () => {
  it("shortens an absolute path down to the tests/ subtree", () => {
    expect(relativePath("/Users/julian/parsnipia/tests/About/About.test.tsx")).toBe(
      "tests/About/About.test.tsx",
    );
  });

  it("returns the path unchanged when there's no /tests/ marker", () => {
    expect(relativePath("no-marker-here.test.ts")).toBe("no-marker-here.test.ts");
  });
});

describe("loadTestResults", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches and parses the results file", async () => {
    const data = { numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, testResults: [] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response);

    await expect(loadTestResults("/data/test-results.json")).resolves.toEqual(data);
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/test-results.json", {
      cache: "no-store",
    });
  });

  it("reports a friendly message when the response isn't ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    await expect(loadTestResults()).rejects.toThrow(/run `npm test`/i);
  });

  it("reports a friendly message when the fetch itself rejects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(loadTestResults()).rejects.toThrow(/run `npm test`/i);
  });

  it("reports a friendly message when the response body isn't valid JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("bad json")),
    } as Response);

    await expect(loadTestResults()).rejects.toThrow(/run `npm test`/i);
  });
});

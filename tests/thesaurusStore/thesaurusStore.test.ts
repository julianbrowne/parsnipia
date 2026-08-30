import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  parseThesaurusList,
  createThesaurusStore,
  loadThesaurusStore,
} from "../../src/thesaurusStore/thesaurusStore";

describe("parseThesaurusList", () => {
  it("parses tab-separated rows", () => {
    const entries = parseThesaurusList("happy\tglad\nhappy\tfelicitous\nsad\tsorry");
    expect(entries.get("happy")).toEqual(["glad", "felicitous"]);
    expect(entries.get("sad")).toEqual(["sorry"]);
  });

  it("ignores blank lines and # comments", () => {
    const raw = ["# a header", "", "happy\tglad", "# another comment"].join("\n");
    expect(parseThesaurusList(raw).size).toBe(1);
  });

  it("skips malformed lines missing a synonym column", () => {
    expect(parseThesaurusList("justoneword").size).toBe(0);
  });
});

describe("createThesaurusStore", () => {
  const store = createThesaurusStore(
    parseThesaurusList(["happy\tglad", "happy\tfelicitous", "sad\tsorry"].join("\n")),
  );

  it("reports its total entry count across all words", () => {
    expect(store.size).toBe(3);
  });

  it("finds every synonym for a known word", () => {
    expect(store.findSynonyms("happy")).toEqual(["glad", "felicitous"]);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(store.findSynonyms("  HAPPY  ")).toEqual(["glad", "felicitous"]);
  });

  it("returns an empty array for an unknown word", () => {
    expect(store.findSynonyms("zzyzx")).toEqual([]);
  });
});

describe("loadThesaurusStore", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches the thesaurus list and builds a store from it", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("happy\tglad\n"),
    } as Response);

    const store = await loadThesaurusStore("/data/test-thesaurus.tsv");

    expect(globalThis.fetch).toHaveBeenCalledWith("/data/test-thesaurus.tsv");
    expect(store.findSynonyms("happy")).toEqual(["glad"]);
  });

  it("throws if the fetch response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(loadThesaurusStore("/data/missing.tsv")).rejects.toThrow(/404/);
  });
});

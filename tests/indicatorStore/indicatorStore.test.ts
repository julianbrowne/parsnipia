import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeIndicatorPhrase,
  parseIndicatorList,
  createIndicatorStore,
  loadIndicatorStore,
  tokenizeClue,
  findIndicatorMatches,
  describeWordplay,
} from "../../src/indicatorStore/indicatorStore";

describe("normalizeIndicatorPhrase", () => {
  it("lower-cases and trims", () => {
    expect(normalizeIndicatorPhrase("  ODDLY  ")).toBe("oddly");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeIndicatorPhrase("every   other")).toBe("every other");
  });
});

describe("parseIndicatorList", () => {
  it("parses tab-separated rows", () => {
    const entries = parseIndicatorList("mixed\tanagram\t12\nabout\treversal\t3");
    expect(entries.get("mixed")).toEqual([{ wordplay: "anagram", count: 12 }]);
    expect(entries.get("about")).toEqual([{ wordplay: "reversal", count: 3 }]);
  });

  it("groups multiple wordplay types under the same phrase", () => {
    const entries = parseIndicatorList("odd\talternation\t1\nodd\tanagram\t2");
    expect(entries.get("odd")).toEqual([
      { wordplay: "alternation", count: 1 },
      { wordplay: "anagram", count: 2 },
    ]);
  });

  it("ignores blank lines and # comments", () => {
    const raw = ["# a header", "", "mixed\tanagram\t1", "# another comment"].join("\n");
    expect(parseIndicatorList(raw).size).toBe(1);
  });

  it("defaults a missing or non-numeric count to 0", () => {
    const entries = parseIndicatorList("mixed\tanagram\t");
    expect(entries.get("mixed")).toEqual([{ wordplay: "anagram", count: 0 }]);
  });

  it("skips malformed lines missing a wordplay column", () => {
    expect(parseIndicatorList("just-one-column").size).toBe(0);
  });
});

describe("createIndicatorStore", () => {
  const store = createIndicatorStore(
    parseIndicatorList(
      ["mixed\tanagram\t12", "odd\talternation\t1", "odd\tanagram\t2"].join("\n"),
    ),
  );

  it("reports its total entry count across all phrases", () => {
    expect(store.size).toBe(3);
  });

  it("finds every wordplay type for a known phrase", () => {
    expect(store.lookup("odd")).toEqual([
      { wordplay: "alternation", count: 1 },
      { wordplay: "anagram", count: 2 },
    ]);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(store.lookup("  MIXED  ")).toEqual([{ wordplay: "anagram", count: 12 }]);
  });

  it("returns an empty array for an unknown phrase", () => {
    expect(store.lookup("zzyzx")).toEqual([]);
  });

  it("computes the longest known phrase length in words", () => {
    const multiWord = createIndicatorStore(
      parseIndicatorList("in a state\tanagram\t1\nodd\talternation\t1"),
    );
    expect(multiWord.maxPhraseWords).toBe(3);
  });
});

describe("loadIndicatorStore", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches the indicator list and builds a store from it", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("mixed\tanagram\t12\n"),
    } as Response);

    const store = await loadIndicatorStore("/data/test-indicators.tsv");

    expect(globalThis.fetch).toHaveBeenCalledWith("/data/test-indicators.tsv");
    expect(store.lookup("mixed")).toEqual([{ wordplay: "anagram", count: 12 }]);
  });

  it("throws if the fetch response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(loadIndicatorStore("/data/missing.tsv")).rejects.toThrow(/404/);
  });
});

describe("tokenizeClue", () => {
  it("splits on whitespace", () => {
    expect(tokenizeClue("Mixed up drink (5)")).toEqual(["Mixed", "up", "drink", "(5)"]);
  });

  it("collapses repeated whitespace and trims", () => {
    expect(tokenizeClue("  a   b  ")).toEqual(["a", "b"]);
  });

  it("returns an empty array for blank input", () => {
    expect(tokenizeClue("   ")).toEqual([]);
  });
});

describe("findIndicatorMatches", () => {
  const store = createIndicatorStore(
    parseIndicatorList(
      [
        "mixed\tanagram\t12",
        "odd\talternation\t1",
        "odd\tanagram\t2",
        "at sea\tanagram\t5",
      ].join("\n"),
    ),
  );

  it("finds a single-word indicator and its span", () => {
    const tokens = tokenizeClue("Drink mixed up");
    const matches = findIndicatorMatches(store, tokens);
    expect(matches).toContainEqual({
      wordplay: "anagram",
      count: 12,
      phrase: "mixed",
      startWord: 1,
      endWord: 2,
    });
  });

  it("returns every wordplay type for an ambiguous phrase, longest/highest-count first", () => {
    const tokens = tokenizeClue("odd");
    const matches = findIndicatorMatches(store, tokens);
    expect(matches).toEqual([
      { wordplay: "anagram", count: 2, phrase: "odd", startWord: 0, endWord: 1 },
      { wordplay: "alternation", count: 1, phrase: "odd", startWord: 0, endWord: 1 },
    ]);
  });

  it("finds multi-word indicator phrases spanning several tokens", () => {
    const tokens = tokenizeClue("Sailor at sea again");
    const matches = findIndicatorMatches(store, tokens);
    expect(matches).toContainEqual({
      wordplay: "anagram",
      count: 5,
      phrase: "at sea",
      startWord: 1,
      endWord: 3,
    });
  });

  it("strips punctuation from tokens before matching", () => {
    const tokens = tokenizeClue("Drink, mixed. up!");
    const matches = findIndicatorMatches(store, tokens);
    expect(matches.some((m) => m.phrase === "mixed")).toBe(true);
  });

  it("returns an empty array when nothing matches", () => {
    expect(findIndicatorMatches(store, tokenizeClue("plain sailing"))).toEqual([]);
  });

  it("returns an empty array for an empty token list", () => {
    expect(findIndicatorMatches(store, [])).toEqual([]);
  });
});

describe("describeWordplay", () => {
  it("describes a known wordplay type", () => {
    expect(describeWordplay("anagram")).toMatch(/jumbled/i);
  });

  it("falls back to a generic description for an unknown type", () => {
    expect(describeWordplay("made-up-type")).toBe("This may be a cryptic wordplay indicator.");
  });
});

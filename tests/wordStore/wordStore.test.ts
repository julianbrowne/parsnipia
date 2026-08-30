import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeWord,
  parseWordList,
  createWordStore,
  loadWordStore,
  findHiddenWords,
} from "../../src/wordStore/wordStore";

describe("normalizeWord", () => {
  it("lower-cases the word", () => {
    expect(normalizeWord("CROSSWORD")).toBe("crossword");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeWord("  puzzle  ")).toBe("puzzle");
  });
});

describe("parseWordList", () => {
  it("parses one word per line", () => {
    const words = parseWordList("apple\nbanana\ncherry");
    expect(words).toEqual(new Set(["apple", "banana", "cherry"]));
  });

  it("ignores blank lines", () => {
    const words = parseWordList("apple\n\n\nbanana\n");
    expect(words).toEqual(new Set(["apple", "banana"]));
  });

  it("ignores comment lines starting with #", () => {
    const raw = ["# a header comment", "# another comment", "apple", "banana"].join(
      "\n",
    );
    expect(parseWordList(raw)).toEqual(new Set(["apple", "banana"]));
  });

  it("returns an empty set for an empty file", () => {
    expect(parseWordList("")).toEqual(new Set());
  });
});

describe("createWordStore", () => {
  const store = createWordStore(new Set(["apple", "banana", "crossword"]));

  it("reports its size", () => {
    expect(store.size).toBe(3);
  });

  it("finds words that are present", () => {
    expect(store.has("apple")).toBe(true);
  });

  it("reports words that are absent as false", () => {
    expect(store.has("zzyzx")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(store.has("CROSSWORD")).toBe(true);
    expect(store.has("CrossWord")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(store.has("  banana  ")).toBe(true);
  });
});

describe("findMatches", () => {
  const store = createWordStore(
    new Set(["cat", "cot", "cut", "cart", "cats", "dog"]),
  );

  it("finds every word matching a pattern with a single wildcard", () => {
    expect(store.findMatches("c?t")).toEqual(["cat", "cot", "cut"]);
  });

  it("finds every word matching a pattern with multiple wildcards", () => {
    expect(store.findMatches("?a?")).toEqual(["cat"]);
  });

  it("only matches words of the same length", () => {
    expect(store.findMatches("c?rt")).toEqual(["cart"]);
    expect(store.findMatches("c?ts")).toEqual(["cats"]);
  });

  it("is case-insensitive", () => {
    expect(store.findMatches("C?T")).toEqual(["cat", "cot", "cut"]);
  });

  it("returns an exact match when the pattern has no wildcards", () => {
    expect(store.findMatches("dog")).toEqual(["dog"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(store.findMatches("z?z")).toEqual([]);
  });

  it("treats regex-special characters in the pattern literally", () => {
    expect(store.findMatches("c.t")).toEqual([]);
    expect(store.findMatches("c*t")).toEqual([]);
  });
});

describe("findAnagrams", () => {
  const store = createWordStore(
    new Set(["cat", "act", "tac", "cot", "tick", "kit", "dog", "cats", "cast"]),
  );

  it("finds every rearrangement of the exact letters when there are no wildcards", () => {
    expect(store.findAnagrams("cat")).toEqual(["act", "cat", "tac"]);
  });

  it("is case-insensitive", () => {
    expect(store.findAnagrams("CAT")).toEqual(["act", "cat", "tac"]);
  });

  it("only matches words of the same length", () => {
    expect(store.findAnagrams("cats")).toEqual(["cast", "cats"]);
  });

  it("treats ? as a wildcard letter that can be anything", () => {
    // one wildcard: any 3-letter word containing at least a 'c' and a 't'
    expect(store.findAnagrams("c?t")).toEqual(["act", "cat", "cot", "tac"]);
  });

  it("lets multiple wildcards each stand in for any letter", () => {
    // both letters unknown: matches every known 3-letter word
    expect(store.findAnagrams("??t")).toEqual(["act", "cat", "cot", "kit", "tac"]);
  });

  it("matches every word of the right length when the input is all wildcards", () => {
    expect(store.findAnagrams("???")).toEqual(["act", "cat", "cot", "dog", "kit", "tac"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(store.findAnagrams("xyz")).toEqual([]);
  });

  it("requires enough of a repeated fixed letter, not just its presence", () => {
    const repeats = createWordStore(new Set(["eave", "code"]));
    // fixed letters are "e", "e" (2 wildcards) — needs at least two e's
    expect(repeats.findAnagrams("ee??")).toEqual(["eave"]);
  });
});

describe("findHiddenWords", () => {
  const store = createWordStore(new Set(["cat", "art"]));

  it("finds a word hidden within a single larger word", () => {
    // "category" contains "cat" as its first 3 letters, but "category"
    // itself isn't "cat" — a genuine partial, hidden match.
    const matches = findHiddenWords(store, "the category store", 3);
    expect(matches).toContainEqual({ word: "cat", start: 4, end: 7 });
    expect("the category store".slice(4, 7)).toBe("cat");
  });

  it("finds a word hidden across a word break, highlighting the gap it crosses", () => {
    // letters: t h e c a t e r r i e r -> "cat" spans the space in "ca terrier"
    const matches = findHiddenWords(store, "the ca terrier", 3);
    expect(matches).toContainEqual({ word: "cat", start: 4, end: 8 });
    expect("the ca terrier".slice(4, 8)).toBe("ca t");
  });

  it("excludes a match that is simply one of the original words, unchanged", () => {
    // "like" appears verbatim as its own word — not hidden, just itself.
    // "calf" genuinely is hidden, crossing "mathemati-cal f-unction".
    const clueStore = createWordStore(new Set(["like", "calf"]));
    const matches = findHiddenWords(clueStore, "sounds like any mathematical function", 4);
    expect(matches.some((match) => match.word === "like")).toBe(false);
    expect(matches).toContainEqual({ word: "calf", start: 25, end: 30 });
    expect("sounds like any mathematical function".slice(25, 30)).toBe("cal f");
  });

  it("still excludes a whole-word match even when it's the only word in the sentence", () => {
    const clueStore = createWordStore(new Set(["cat"]));
    expect(findHiddenWords(clueStore, "cat", 3)).toEqual([]);
  });

  it("does not exclude a match spanning two whole adjacent words", () => {
    // "heat" = the whole of "he" plus the whole of "ate" — still hidden,
    // since it isn't equal to either individual word.
    const clueStore = createWordStore(new Set(["heat"]));
    const matches = findHiddenWords(clueStore, "he ate lunch", 4);
    expect(matches).toContainEqual({ word: "heat", start: 0, end: 5 });
  });

  it("is case-insensitive", () => {
    const matches = findHiddenWords(store, "THE CATEGORY STORE", 3);
    expect(matches).toContainEqual({ word: "cat", start: 4, end: 7 });
  });

  it("ignores punctuation, including ? — wildcards aren't a thing here", () => {
    // "c?at!s" (4 letters: c,a,t,s) — matching just "cat" is a partial,
    // hidden run, not the whole word, so it isn't excluded.
    const matches = findHiddenWords(store, "a c?at!s meow", 3);
    expect(matches).toContainEqual({ word: "cat", start: 2, end: 6 });
    expect("a c?at!s meow".slice(2, 6)).toBe("c?at");
  });

  it("returns an empty array when nothing of that length is hidden", () => {
    expect(findHiddenWords(store, "no matches here", 3)).toEqual([]);
  });

  it("returns an empty array for a non-positive or non-integer length", () => {
    expect(findHiddenWords(store, "the category store", 0)).toEqual([]);
    expect(findHiddenWords(store, "the category store", -3)).toEqual([]);
    expect(findHiddenWords(store, "the category store", 2.5)).toEqual([]);
  });

  it("returns an empty array when the sentence has fewer letters than the requested length", () => {
    expect(findHiddenWords(store, "hi", 5)).toEqual([]);
  });
});

describe("loadWordStore", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches the word list and builds a store from it", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("apple\nbanana\n"),
    } as Response);

    const store = await loadWordStore("/data/test-words.txt");

    expect(globalThis.fetch).toHaveBeenCalledWith("/data/test-words.txt");
    expect(store.has("apple")).toBe(true);
    expect(store.has("banana")).toBe(true);
    expect(store.has("cherry")).toBe(false);
  });

  it("throws if the fetch response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(loadWordStore("/data/missing.txt")).rejects.toThrow(/404/);
  });
});

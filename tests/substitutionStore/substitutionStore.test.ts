import { describe, expect, it } from "vitest";
import {
  normalizeSubstitutionPhrase,
  createSubstitutionStore,
  findSubstitutionMatches,
  DEFAULT_SUBSTITUTION_STORE,
  COMMON_SUBSTITUTIONS,
} from "../../src/substitutionStore/substitutionStore";
import { tokenizeClue } from "../../src/indicatorStore/indicatorStore";

describe("normalizeSubstitutionPhrase", () => {
  it("lower-cases and trims", () => {
    expect(normalizeSubstitutionPhrase("  NORTH  ")).toBe("north");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeSubstitutionPhrase("five  hundred")).toBe("five hundred");
  });
});

describe("createSubstitutionStore", () => {
  const store = createSubstitutionStore([
    { phrase: "north", letters: "N" },
    { phrase: "odd", letters: "o" },
    { phrase: "odd", letters: "d" }, // same phrase, two possible letters
  ]);

  it("reports its distinct-phrase count", () => {
    expect(store.size).toBe(2);
  });

  it("finds a known phrase, lower-cased", () => {
    expect(store.lookup("north")).toEqual(["n"]);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(store.lookup("  NORTH  ")).toEqual(["n"]);
  });

  it("returns every letter option for an ambiguous phrase", () => {
    expect(store.lookup("odd")).toEqual(["o", "d"]);
  });

  it("returns an empty array for an unknown phrase", () => {
    expect(store.lookup("zzyzx")).toEqual([]);
  });

  it("computes the longest known phrase length in words", () => {
    const multiWord = createSubstitutionStore([
      { phrase: "five hundred", letters: "d" },
      { phrase: "north", letters: "n" },
    ]);
    expect(multiWord.maxPhraseWords).toBe(2);
  });

  it("defaults to COMMON_SUBSTITUTIONS when built with no arguments", () => {
    expect(createSubstitutionStore().lookup("north")).toEqual(["n"]);
  });
});

describe("findSubstitutionMatches", () => {
  const store = createSubstitutionStore([
    { phrase: "north", letters: "n" },
    { phrase: "five", letters: "v" },
    { phrase: "five hundred", letters: "d" },
  ]);

  it("finds a single-word substitution and its span", () => {
    const tokens = tokenizeClue("Head North for gold");
    expect(findSubstitutionMatches(store, tokens)).toContainEqual({
      phrase: "north",
      letters: "n",
      startWord: 1,
      endWord: 2,
    });
  });

  it("prefers the longer of two overlapping phrases first", () => {
    const tokens = tokenizeClue("five hundred pounds");
    const matches = findSubstitutionMatches(store, tokens);
    expect(matches[0]).toEqual({
      phrase: "five hundred",
      letters: "d",
      startWord: 0,
      endWord: 2,
    });
    expect(matches).toContainEqual({
      phrase: "five",
      letters: "v",
      startWord: 0,
      endWord: 1,
    });
  });

  it("strips punctuation from tokens before matching", () => {
    const tokens = tokenizeClue("North, apparently.");
    expect(findSubstitutionMatches(store, tokens).some((m) => m.phrase === "north")).toBe(
      true,
    );
  });

  it("returns an empty array when nothing matches", () => {
    expect(findSubstitutionMatches(store, tokenizeClue("plain sailing"))).toEqual([]);
  });
});

describe("COMMON_SUBSTITUTIONS", () => {
  it("includes the standard compass points, zero stand-ins, and Roman numerals", () => {
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("north")).toEqual(["n"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("south")).toEqual(["s"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("east")).toEqual(["e"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("west")).toEqual(["w"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("love")).toEqual(["o"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("oval")).toEqual(["o"]);
    expect(DEFAULT_SUBSTITUTION_STORE.lookup("five")).toEqual(["v"]);
  });

  it("has no duplicate phrase/letters pairs", () => {
    const seen = new Set<string>();
    for (const { phrase, letters } of COMMON_SUBSTITUTIONS) {
      const key = `${phrase}\t${letters}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

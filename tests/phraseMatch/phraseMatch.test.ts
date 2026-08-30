import { describe, expect, it } from "vitest";
import {
  normalizePhrase,
  normalizeToken,
  createPhraseLookup,
  findPhraseMatches,
  type PhraseSpan,
} from "../../src/phraseMatch/phraseMatch";

describe("normalizePhrase", () => {
  it("lower-cases and trims", () => {
    expect(normalizePhrase("  NORTH  ")).toBe("north");
  });

  it("collapses internal whitespace", () => {
    expect(normalizePhrase("every   other")).toBe("every other");
  });
});

describe("normalizeToken", () => {
  it("lower-cases and strips punctuation", () => {
    expect(normalizeToken("Drink,")).toBe("drink");
  });

  it("keeps hyphens and apostrophes", () => {
    expect(normalizeToken("don't")).toBe("don't");
    expect(normalizeToken("well-known!")).toBe("well-known");
  });

  it("reduces a symbol-only token to an empty string", () => {
    expect(normalizeToken("(5)")).toBe("");
  });
});

describe("createPhraseLookup", () => {
  const index = createPhraseLookup(
    new Map([
      ["mixed", ["anagram"]],
      ["at sea", ["anagram"]],
      ["odd", ["alternation", "anagram"]],
    ]),
  );

  it("finds every value for a known phrase", () => {
    expect(index.lookup("odd")).toEqual(["alternation", "anagram"]);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(index.lookup("  MIXED  ")).toEqual(["anagram"]);
  });

  it("returns an empty array for an unknown phrase", () => {
    expect(index.lookup("zzyzx")).toEqual([]);
  });

  it("computes the longest known phrase length in words", () => {
    expect(index.maxPhraseWords).toBe(2);
  });

  it("defaults maxPhraseWords to 0 for an empty map", () => {
    expect(createPhraseLookup(new Map()).maxPhraseWords).toBe(0);
  });
});

describe("findPhraseMatches", () => {
  const index = createPhraseLookup(
    new Map([
      ["mixed", ["anagram"]],
      ["odd", ["alternation", "anagram"]],
      ["at sea", ["anagram"]],
    ]),
  );

  function combine(value: string, phrase: string, startWord: number, endWord: number): PhraseSpan & { value: string } {
    return { value, phrase, startWord, endWord };
  }

  it("finds a single-word phrase and its span", () => {
    const matches = findPhraseMatches(index, ["Drink", "mixed", "up"], combine);
    expect(matches).toContainEqual({ value: "anagram", phrase: "mixed", startWord: 1, endWord: 2 });
  });

  it("finds a multi-word phrase spanning several tokens", () => {
    const matches = findPhraseMatches(index, ["Sailor", "at", "sea", "again"], combine);
    expect(matches).toContainEqual({ value: "anagram", phrase: "at sea", startWord: 1, endWord: 3 });
  });

  it("returns one match per value for an ambiguous phrase", () => {
    const matches = findPhraseMatches(index, ["odd"], combine);
    expect(matches).toEqual(
      expect.arrayContaining([
        { value: "alternation", phrase: "odd", startWord: 0, endWord: 1 },
        { value: "anagram", phrase: "odd", startWord: 0, endWord: 1 },
      ]),
    );
    expect(matches).toHaveLength(2);
  });

  it("strips punctuation from tokens before matching", () => {
    const matches = findPhraseMatches(index, ["Drink,", "mixed.", "up!"], combine);
    expect(matches.some((m) => m.phrase === "mixed")).toBe(true);
  });

  it("does not let a symbol-only token bridge a multi-word phrase", () => {
    const matches = findPhraseMatches(index, ["at", "(5)", "sea"], combine);
    expect(matches.some((m) => m.phrase === "at sea")).toBe(false);
  });

  it("returns an empty array when nothing matches", () => {
    expect(findPhraseMatches(index, ["plain", "sailing"], combine)).toEqual([]);
  });

  it("returns an empty array for an empty token list", () => {
    expect(findPhraseMatches(index, [], combine)).toEqual([]);
  });

  it("orders longer spans before shorter ones, regardless of tiebreak", () => {
    const twoWordIndex = createPhraseLookup(
      new Map([
        ["at sea", ["long"]],
        ["at", ["short"]],
      ]),
    );
    const matches = findPhraseMatches(twoWordIndex, ["at", "sea"], combine);
    expect(matches.map((m) => m.value)).toEqual(["long", "short"]);
  });

  it("applies tiebreak to matches of the same span length", () => {
    const tiedIndex = createPhraseLookup(new Map([["odd", ["low", "high"]]]));
    const matches = findPhraseMatches(
      tiedIndex,
      ["odd"],
      (value, phrase, startWord, endWord) => ({
        value,
        weight: value === "high" ? 1 : 0,
        phrase,
        startWord,
        endWord,
      }),
      (a, b) => b.weight - a.weight,
    );
    expect(matches.map((m) => m.value)).toEqual(["high", "low"]);
  });

  it("falls back to left-to-right order when spans and tiebreak are equal", () => {
    const repeatedIndex = createPhraseLookup(new Map([["a", ["hit"]]]));
    const matches = findPhraseMatches(repeatedIndex, ["a", "b", "a"], combine);
    expect(matches.map((m) => m.startWord)).toEqual([0, 2]);
  });
});

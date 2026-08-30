// The substitution store holds cryptic-crossword letter substitutions:
// common words or short phrases that themselves stand in for a letter
// (or short abbreviation) within a clue's wordplay — e.g. "North" for N,
// "Five" for its Roman numeral V. This is deliberately a small,
// hand-curated list rather than a fetched dataset — extend
// COMMON_SUBSTITUTIONS directly below as you come across new ones in
// real clues.

import {
  normalizePhrase,
  createPhraseLookup,
  findPhraseMatches,
  type PhraseLookup,
  type PhraseSpan,
} from "../phraseMatch/phraseMatch";

/** A word/phrase that can stand in for `letters` in a clue's wordplay. */
export interface Substitution {
  phrase: string;
  letters: string;
}

export const COMMON_SUBSTITUTIONS: Substitution[] = [
  // Compass points
  { phrase: "north", letters: "n" },
  { phrase: "south", letters: "s" },
  { phrase: "east", letters: "e" },
  { phrase: "west", letters: "w" },

  // "Zero" look-alikes / stand-ins
  { phrase: "love", letters: "o" }, // tennis score
  { phrase: "oval", letters: "o" }, // shape of the letter

  // Roman numerals
  { phrase: "one", letters: "i" },
  { phrase: "five", letters: "v" },
  { phrase: "ten", letters: "x" },
  { phrase: "fifty", letters: "l" },
  { phrase: "hundred", letters: "c" },
  { phrase: "thousand", letters: "m" },
];

export interface SubstitutionStore extends PhraseLookup<string> {
  /** Number of distinct phrases held in the store. */
  readonly size: number;
}

/**
 * Normalizes a substitution phrase (or a candidate substring pulled from
 * a clue) for lookup: trims, lower-cases, and collapses internal
 * whitespace.
 */
export const normalizeSubstitutionPhrase = normalizePhrase;

export function createSubstitutionStore(
  entries: Substitution[] = COMMON_SUBSTITUTIONS,
): SubstitutionStore {
  const map = new Map<string, string[]>();

  for (const { phrase, letters } of entries) {
    const normalizedPhrase = normalizeSubstitutionPhrase(phrase);
    const normalizedLetters = letters.trim().toLowerCase();

    const existing = map.get(normalizedPhrase);
    if (existing) {
      if (!existing.includes(normalizedLetters)) {
        existing.push(normalizedLetters);
      }
    } else {
      map.set(normalizedPhrase, [normalizedLetters]);
    }
  }

  return { size: map.size, ...createPhraseLookup(map) };
}

/** Ready-to-use store built from COMMON_SUBSTITUTIONS — no fetch needed. */
export const DEFAULT_SUBSTITUTION_STORE = createSubstitutionStore();

/** A candidate substitution: `tokens[startWord..endWord)` can stand in for `letters`. */
export interface SubstitutionMatch extends PhraseSpan {
  letters: string;
}

/**
 * Scans every contiguous run of `tokens` (up to `store.maxPhraseWords`
 * long) for known substitution phrases, returning one SubstitutionMatch
 * per (span, letters) hit. Ordered with the longest phrases first.
 */
export function findSubstitutionMatches(
  store: SubstitutionStore,
  tokens: string[],
): SubstitutionMatch[] {
  return findPhraseMatches(store, tokens, (letters, phrase, startWord, endWord) => ({
    phrase,
    letters,
    startWord,
    endWord,
  }));
}

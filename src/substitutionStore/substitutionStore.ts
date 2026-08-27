// The substitution store holds cryptic-crossword letter substitutions:
// common words or short phrases that themselves stand in for a letter
// (or short abbreviation) within a clue's wordplay — e.g. "North" for N,
// "Five" for its Roman numeral V. This is deliberately a small,
// hand-curated list rather than a fetched dataset — extend
// COMMON_SUBSTITUTIONS directly below as you come across new ones in
// real clues.

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

export interface SubstitutionStore {
  /** Number of distinct phrases held in the store. */
  readonly size: number;
  /** The most words any known phrase spans (for bounding an n-gram search). */
  readonly maxPhraseWords: number;
  /** Every letter-sequence `phrase` (case-insensitively, whitespace-normalized) can substitute for. */
  lookup(phrase: string): string[];
}

/**
 * Normalizes a substitution phrase (or a candidate substring pulled from
 * a clue) for lookup: trims, lower-cases, and collapses internal
 * whitespace.
 */
export function normalizeSubstitutionPhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createSubstitutionStore(
  entries: Substitution[] = COMMON_SUBSTITUTIONS,
): SubstitutionStore {
  const map = new Map<string, string[]>();
  let maxPhraseWords = 0;

  for (const { phrase, letters } of entries) {
    const normalizedPhrase = normalizeSubstitutionPhrase(phrase);
    const normalizedLetters = letters.trim().toLowerCase();
    maxPhraseWords = Math.max(maxPhraseWords, normalizedPhrase.split(" ").length);

    const existing = map.get(normalizedPhrase);
    if (existing) {
      if (!existing.includes(normalizedLetters)) {
        existing.push(normalizedLetters);
      }
    } else {
      map.set(normalizedPhrase, [normalizedLetters]);
    }
  }

  return {
    size: map.size,
    maxPhraseWords,
    lookup(phrase: string) {
      return map.get(normalizeSubstitutionPhrase(phrase)) ?? [];
    },
  };
}

/** Ready-to-use store built from COMMON_SUBSTITUTIONS — no fetch needed. */
export const DEFAULT_SUBSTITUTION_STORE = createSubstitutionStore();

/** Strips a token down to the letters (plus hyphens/apostrophes) used for matching. */
function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z'-]/g, "");
}

/** A candidate substitution: `tokens[startWord..endWord)` can stand in for `letters`. */
export interface SubstitutionMatch {
  /** The normalized phrase that matched. */
  phrase: string;
  letters: string;
  /** Index (inclusive) of the first matched word in the token list. */
  startWord: number;
  /** Index (exclusive) of the word after the match in the token list. */
  endWord: number;
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
  const normalized = tokens.map(normalizeToken);
  const matches: SubstitutionMatch[] = [];

  for (let start = 0; start < normalized.length; start++) {
    const words: string[] = [];
    for (let end = start; end < normalized.length && words.length < store.maxPhraseWords; end++) {
      const word = normalized[end];
      if (word === "") {
        break; // don't let a stray symbol-only token bridge a phrase
      }
      words.push(word);
      const phrase = words.join(" ");
      for (const letters of store.lookup(phrase)) {
        matches.push({ phrase, letters, startWord: start, endWord: end + 1 });
      }
    }
  }

  return matches.sort(
    (a, b) => b.endWord - b.startWord - (a.endWord - a.startWord) || a.startWord - b.startWord,
  );
}

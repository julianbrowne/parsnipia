// Shared machinery for "does any known phrase appear in this clue" style
// matching. Both the indicator store (wordplay indicators like "mixed
// up") and the substitution store (letter substitutions like "North")
// are a normalized-phrase lookup table plus an n-gram scan over a clue's
// tokens — this module holds that common part so each store only has to
// define what a phrase maps to and how to build a match record from it.

/** A phrase-keyed lookup table, with the longest known phrase's word count cached. */
export interface PhraseLookup<T> {
  /** The most words any known phrase spans (bounds the scan in findPhraseMatches). */
  readonly maxPhraseWords: number;
  /** Every value `phrase` (case-insensitively, whitespace-normalized) is known to map to. */
  lookup(phrase: string): T[];
}

/** Trims, lower-cases, and collapses internal whitespace — for both stored and candidate phrases. */
export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Strips a clue token down to the letters (plus hyphens/apostrophes) used for phrase matching. */
export function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z'-]/g, "");
}

/** Builds a PhraseLookup from an already-grouped phrase -> values map. */
export function createPhraseLookup<T>(entries: Map<string, T[]>): PhraseLookup<T> {
  let maxPhraseWords = 0;
  for (const phrase of entries.keys()) {
    maxPhraseWords = Math.max(maxPhraseWords, phrase.split(" ").length);
  }
  return {
    maxPhraseWords,
    lookup(phrase: string) {
      return entries.get(normalizePhrase(phrase)) ?? [];
    },
  };
}

/** The span a phrase match covers in a token list. */
export interface PhraseSpan {
  /** The normalized phrase that matched. */
  phrase: string;
  /** Index (inclusive) of the first matched word in the token list. */
  startWord: number;
  /** Index (exclusive) of the word after the match in the token list. */
  endWord: number;
}

/**
 * Scans every contiguous run of `tokens` (up to `index.maxPhraseWords`
 * long) for known phrases, calling `combine` to build a match record for
 * each (span, value) hit — the same span can map to more than one value
 * when the phrase is ambiguous, and spans can overlap. Ordered
 * longest-span first, then by `tiebreak` (if given), then left to right.
 */
export function findPhraseMatches<T, R extends PhraseSpan>(
  index: PhraseLookup<T>,
  tokens: string[],
  combine: (value: T, phrase: string, startWord: number, endWord: number) => R,
  tiebreak?: (a: R, b: R) => number,
): R[] {
  const normalized = tokens.map(normalizeToken);
  const matches: R[] = [];

  for (let start = 0; start < normalized.length; start++) {
    const words: string[] = [];
    for (let end = start; end < normalized.length && words.length < index.maxPhraseWords; end++) {
      const word = normalized[end];
      if (word === "") {
        break; // don't let a stray symbol-only token bridge a phrase
      }
      words.push(word);
      const phrase = words.join(" ");
      for (const value of index.lookup(phrase)) {
        matches.push(combine(value, phrase, start, end + 1));
      }
    }
  }

  return matches.sort(
    (a, b) =>
      b.endWord - b.startWord - (a.endWord - a.startWord) ||
      (tiebreak?.(a, b) ?? 0) ||
      a.startWord - b.startWord,
  );
}

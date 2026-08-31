#!/usr/bin/env node
// Downloads Moby Thesaurus's word list and builds a compact
// word -> synonyms lookup for the thesaurus ("Find A Matching Word")
// feature, written to public/data/thesaurus.tsv.
//
// Moby's data is one line per headword: the headword followed by every
// term Grady Ward judged related to it, e.g.
//
//   woman,Eve,Frau,adult,...,lady,...,womenfolks
//
// That list is one-directional and much looser than WordNet's synsets —
// it mixes near-synonyms, related concepts and specific examples rather
// than strict sense-for-sense equivalents. That looseness is the point:
// a crossword solver typing "woman" wants "lady" to turn up, even though
// the two aren't interchangeable in every sense, and Moby's flat
// related-terms list includes it where WordNet's stricter synsets don't.
//
// Because the relation is one-directional in the source (only listed
// under "woman", not necessarily under "lady"), this script adds the
// reverse pair too, so a lookup for either word finds the other.
//
// Multi-word entries (headwords or related terms, e.g. "a cappella",
// "common-law wife") are skipped — the app's thesaurus lookup, like its
// word list, only deals in single words.
//
// Moby's related-terms lists are also far larger and looser than
// WordNet's synsets (some headwords list 100+ related terms, including
// archaic and dialect forms), which without filtering balloons the
// output to over 40MB — a lot to ship to a browser for one feature.
// Since every answer this app cares about has to be a valid crossword
// word anyway, this script keeps only pairs where both words appear in
// the app's own UK word list (public/data/words-en-gb.txt) — this both
// shrinks the file drastically and drops noise (foreign borrowings,
// oddities) that couldn't be a crossword answer here regardless.
//
// Re-run any time you want to refresh the data or move to a newer
// commit:
//
//   npm run fetch-thesaurus
//
// Data: Moby Thesaurus, compiled by Grady Ward, placed in the public
// domain as part of Project Gutenberg's Moby lexicon project. Fetched
// from the words/moby GitHub repo, which packages the same data
// (MIT-licensed wrapper code; the word list itself remains public
// domain) <https://github.com/words/moby>.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(new URL("../public/data/thesaurus.tsv", import.meta.url));
const WORDLIST_PATH = fileURLToPath(new URL("../public/data/words-en-gb.txt", import.meta.url));

// Pinned to a specific commit (rather than `master`) so this script
// produces the same output until someone deliberately bumps it.
const COMMIT = "62b916d83a13324094c16c0e7a0fe9c6c8caeb61";
const SOURCE_URL = `https://raw.githubusercontent.com/words/moby/${COMMIT}/words.txt`;

const SINGLE_WORD = /^[a-z]+$/;

async function main() {
  console.log(`Loading word list from ${WORDLIST_PATH} ...`);
  const wordlistRaw = await readFile(WORDLIST_PATH, "utf-8");
  const validWords = new Set(
    wordlistRaw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#")),
  );
  console.log(`Loaded ${validWords.size} valid words.`);

  console.log(`Fetching Moby Thesaurus from ${SOURCE_URL} ...`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Moby Thesaurus: ${response.status} ${response.statusText}`);
  }
  const raw = await response.text();

  // word -> set of every other single word related to it, in either
  // direction (see the reverse-pair note above).
  const synonymsOf = new Map();
  const addPair = (word, synonym) => {
    if (word === synonym) {
      return;
    }
    let synonyms = synonymsOf.get(word);
    if (!synonyms) {
      synonyms = new Set();
      synonymsOf.set(word, synonyms);
    }
    synonyms.add(synonym);
  };

  let headwordCount = 0;
  for (const line of raw.split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const fields = line.split(",").map((field) => field.trim().toLowerCase());
    const [headword, ...related] = fields;
    if (!SINGLE_WORD.test(headword) || !validWords.has(headword)) {
      continue; // skip multi-word headwords ("a cappella") and anything not a known dictionary word
    }
    headwordCount++;
    for (const term of related) {
      if (!SINGLE_WORD.test(term) || !validWords.has(term)) {
        continue; // skip multi-word related terms ("common-law wife") and non-dictionary words
      }
      addPair(headword, term);
      addPair(term, headword);
    }
  }

  const words = [...synonymsOf.keys()].sort();
  const pairCount = words.reduce((sum, word) => sum + synonymsOf.get(word).size, 0);

  const header = [
    "# Parsnipia thesaurus lookup",
    "#",
    "# Derived from Moby Thesaurus, compiled by Grady Ward and placed in",
    "# the public domain as part of Project Gutenberg's Moby lexicon",
    "# project. Fetched from the words/moby GitHub repo",
    "# <https://github.com/words/moby>, which packages the same data",
    "# (MIT-licensed wrapper code; the word list itself is public domain,",
    "# so no attribution is legally required, though it's credited on the",
    "# About page as good practice).",
    "#",
    `# Generated: ${new Date().toISOString()}`,
    `# Source: ${SOURCE_URL}`,
    `# Rows: ${pairCount} word/synonym pairs across ${words.length} words`,
    "#",
    "# Columns (tab-separated, no header row below this comment block):",
    "#   word      — a lowercase single word",
    "#   synonym   — another lowercase single word Moby lists as related",
    "#               to it — a looser, broader relation than WordNet's",
    "#               synsets, deliberately so (see the comment at the top",
    "#               of this script). Pairs are added in both directions",
    "#               even though Moby's own list is one-directional, and",
    "#               both words in every pair are confirmed entries in",
    "#               the app's own UK word list (words-en-gb.txt).",
    "#",
    "",
  ].join("\n");

  const body = words
    .flatMap((word) => [...synonymsOf.get(word)].sort().map((synonym) => `${word}\t${synonym}`))
    .join("\n");

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, header + body + "\n", "utf-8");

  console.log(
    `Parsed ${headwordCount} Moby headwords into ${pairCount} word/synonym pairs ` +
      `(${words.length} words) and wrote them to ${OUTPUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

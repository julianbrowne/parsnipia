#!/usr/bin/env node
// Downloads Open English WordNet's JSON release and builds a compact
// word -> synonyms lookup for the thesaurus ("Find A Matching Word")
// feature, written to public/data/thesaurus.tsv.
//
// WordNet groups words into "synsets" (sets of words judged
// synonymous in some sense) rather than a simple word -> synonym list,
// and splits that data across ~70 files (an index per starting letter,
// plus one file per semantic category per part of speech). This script
// flattens all of that into the one thing the app actually needs: for
// each single-word entry, every other single word sharing at least one
// of its synsets, merged across every part of speech and sense (this
// doesn't distinguish "run" the verb from "run" the noun — a simpler,
// flatter thesaurus than WordNet itself models, but a much simpler
// lookup for a crossword solver).
//
// Re-run any time you want to refresh the data or move to a newer
// release:
//
//   npm run fetch-thesaurus
//
// Requires `unzip` on PATH (present by default on macOS and GitHub
// Actions' ubuntu-latest runners) — the release ships as a .zip and
// Node has no built-in zip reader.

import { writeFile, mkdir, mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const OUTPUT_PATH = fileURLToPath(new URL("../public/data/thesaurus.tsv", import.meta.url));

const RELEASE_TAG = "2025-edition";
const SOURCE_URL = `https://github.com/globalwordnet/english-wordnet/releases/download/${RELEASE_TAG}/english-wordnet-2025-json.zip`;

const SINGLE_WORD = /^[a-z]+$/;

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "parsnipia-thesaurus-"));
  try {
    console.log(`Fetching Open English WordNet from ${SOURCE_URL} ...`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch WordNet: ${response.status} ${response.statusText}`);
    }
    const zipPath = join(workDir, "wordnet.zip");
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));

    console.log("Unzipping ...");
    execFileSync("unzip", ["-o", "-q", zipPath, "-d", workDir]);

    const files = await readdir(workDir);
    const entryFiles = files.filter((f) => f.startsWith("entries-") && f.endsWith(".json"));
    const synsetFiles = files.filter(
      (f) =>
        (f.startsWith("noun.") ||
          f.startsWith("verb.") ||
          f.startsWith("adj.") ||
          f.startsWith("adv.")) &&
        f.endsWith(".json"),
    );

    console.log(
      `Merging ${synsetFiles.length} synset files and ${entryFiles.length} entry files ...`,
    );

    // synset id (e.g. "00001740-n") -> its member words
    const synsetMembers = new Map();
    for (const file of synsetFiles) {
      const synsets = JSON.parse(await readFile(join(workDir, file), "utf-8"));
      for (const [synsetId, synset] of Object.entries(synsets)) {
        synsetMembers.set(synsetId, synset.members ?? []);
      }
    }

    // word -> set of every other single word sharing one of its synsets
    const synonymsOf = new Map();
    for (const file of entryFiles) {
      const entries = JSON.parse(await readFile(join(workDir, file), "utf-8"));
      for (const [word, byPartOfSpeech] of Object.entries(entries)) {
        const normalizedWord = word.toLowerCase();
        if (!SINGLE_WORD.test(normalizedWord)) {
          continue; // skip multi-word phrases ("physical entity") and anything non-alphabetic
        }
        for (const posEntry of Object.values(byPartOfSpeech)) {
          for (const sense of posEntry.sense ?? []) {
            const members = synsetMembers.get(sense.synset) ?? [];
            for (const member of members) {
              const normalizedMember = member.toLowerCase();
              if (!SINGLE_WORD.test(normalizedMember) || normalizedMember === normalizedWord) {
                continue;
              }
              let synonyms = synonymsOf.get(normalizedWord);
              if (!synonyms) {
                synonyms = new Set();
                synonymsOf.set(normalizedWord, synonyms);
              }
              synonyms.add(normalizedMember);
            }
          }
        }
      }
    }

    const words = [...synonymsOf.keys()].sort();
    const pairCount = words.reduce((sum, word) => sum + synonymsOf.get(word).size, 0);

    const header = [
      "# Parsnipia thesaurus lookup",
      "#",
      '# Derived from "Open English WordNet" <https://en-word.net>, a fork',
      "# of Princeton WordNet <https://wordnet.princeton.edu> maintained by",
      "# the Global WordNet Association, licensed under the Creative Commons",
      "# Attribution 4.0 International License",
      "# <https://creativecommons.org/licenses/by/4.0/>. If you share this",
      "# file or data derived from it, attribute both Princeton WordNet and",
      "# the English WordNet team.",
      "#",
      `# Generated: ${new Date().toISOString()}`,
      `# Source: ${SOURCE_URL}`,
      `# Rows: ${pairCount} word/synonym pairs across ${words.length} words`,
      "#",
      "# Columns (tab-separated, no header row below this comment block):",
      "#   word      — a lowercase single word",
      "#   synonym   — another lowercase single word sharing one of its",
      "#               WordNet synsets, across every part of speech and",
      "#               sense (this doesn't distinguish, say, \"run\" the",
      "#               verb from \"run\" the noun)",
      "#",
      "",
    ].join("\n");

    const body = words
      .flatMap((word) => [...synonymsOf.get(word)].sort().map((synonym) => `${word}\t${synonym}`))
      .join("\n");

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, header + body + "\n", "utf-8");

    console.log(`Wrote ${pairCount} word/synonym pairs (${words.length} words) to ${OUTPUT_PATH}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

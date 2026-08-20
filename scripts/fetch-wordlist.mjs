#!/usr/bin/env node
// Downloads a fresh UK English word list from the SCOWL/ESDB on-demand
// wordlist generator (https://app.aspell.net/create) and writes a cleaned,
// one-word-per-line list to public/data/words-en-gb.txt for the app to
// fetch at runtime.
//
// Re-run this any time you want to refresh the list or change its size /
// spelling settings:
//
//   npm run fetch-wordlist
//
// SCOWL ("Spell Checker Oriented Word Lists") is Kevin Atkinson's project;
// this script talks to its ESDB-based generator. See the license text
// embedded in the generated file's header for full terms.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(
  new URL("../public/data/words-en-gb.txt", import.meta.url),
);

// See https://app.aspell.net/create for the full set of options.
const params = new URLSearchParams();
params.set("max_size", "60"); // SCOWL size: 10 (tiny) .. 95 (huge+). 60 is SCOWL's own "default".
params.set("spelling", "GBs"); // British spelling, "-ise" endings (e.g. "realise", "colour")
params.set("variant_level", "1"); // "1 *default*" — the SCOWL form's own recommended level
params.set("diacritic", "strip"); // "naive" rather than "naïve"
params.append("special", "hacker"); // small bonus list of common computing terms
params.append("special", "roman-numerals");
params.set("download", "wordlist");
params.set("encoding", "utf-8");
params.set("format", "inline");

const SOURCE_URL = `https://app.aspell.net/create?${params.toString()}`;

async function main() {
  console.log(`Fetching word list from ${SOURCE_URL} ...`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch word list: ${response.status} ${response.statusText}`,
    );
  }
  const raw = await response.text();

  const lines = raw.split(/\r?\n/);
  const separatorIndex = lines.indexOf("---");
  if (separatorIndex === -1) {
    throw new Error(
      "Could not find the '---' header/body separator in the downloaded file",
    );
  }

  const licenseHeader = lines.slice(0, separatorIndex);
  const rawWords = lines.slice(separatorIndex + 1);

  // Keep only plain alphabetic entries (crossword answers are letters
  // only) — this drops possessives ("AA's"), hyphenated compounds, etc.
  const cleanWords = [
    ...new Set(
      rawWords
        .map((word) => word.trim().toLowerCase())
        .filter((word) => /^[a-z]+$/.test(word)),
    ),
  ].sort();

  const header = [
    "# Parsnip UK English word list",
    "#",
    "# Derived from the SCOWL/ESDB English Speller Database",
    "# <https://wordlist.aspell.net>, generated via the on-demand list",
    `# builder at ${SOURCE_URL.split("?")[0]}`,
    "#",
    `# Generated: ${new Date().toISOString()}`,
    `# Settings: ${params.toString()}`,
    "#",
    "# Filtered to lowercase alphabetic entries only (one word per line,",
    "# sorted, deduplicated) by scripts/fetch-wordlist.mjs.",
    "#",
    "# Original license notice from the generator follows:",
    "#",
    ...licenseHeader.map((line) => (line ? `# ${line}` : "#")),
    "",
  ].join("\n");

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, header + cleanWords.join("\n") + "\n", "utf-8");

  console.log(`Wrote ${cleanWords.length} words to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

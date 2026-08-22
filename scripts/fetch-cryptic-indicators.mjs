#!/usr/bin/env node
// Downloads the full cryptic-crossword wordplay indicators table from
// George Ho's "Cryptic Crosswords" Datasette instance
// (https://cryptics.georgeho.org) and writes a cleaned, tab-separated
// lookup file to public/data/cryptic-indicators.tsv for the app to fetch
// at runtime.
//
// The Datasette UI/API paginates at 100 rows per page — a one-page export
// (e.g. saving https://cryptics.georgeho.org/data/indicators.json) only
// captures the first 100 of ~15,700 rows. This script instead uses
// Datasette's CSV "stream all rows" mode (`?_stream=on`), which ignores
// the page-size limit and returns every row in one response. It's slow
// (the server streams the whole table, well over a minute) but only
// needs to run when refreshing the data:
//
//   npm run fetch-cryptic-indicators
//
// Data: "Cryptic Crosswords" by George Ho <https://cryptics.georgeho.org>,
// licensed under the Open Database License (ODbL) v1.0
// <https://opendatacommons.org/licenses/odbl/1-0/>. See the header written
// into the output file for the attribution to carry with any copy of it.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(
  new URL("../public/data/cryptic-indicators.tsv", import.meta.url),
);

const SOURCE_URL = "https://cryptics.georgeho.org/data/indicators.csv?_stream=on";

/**
 * Minimal RFC4180-style CSV parser: handles quoted fields, commas and
 * newlines inside quotes, and doubled "" as an escaped quote. Good enough
 * for a well-formed export like this one (no need for a dependency).
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore; \n (handled above) ends the row
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Number of example clue links in a clue_rowids cell, e.g. "[1](...), [2](...)" -> 2. */
function countClueRefs(clueRowidsField) {
  return (clueRowidsField.match(/\/data\/clues\//g) ?? []).length;
}

async function main() {
  console.log(`Fetching indicators from ${SOURCE_URL} ...`);
  console.log("(this streams the whole table and can take a couple of minutes)");
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch indicators: ${response.status} ${response.statusText}`,
    );
  }
  const csv = await response.text();
  const [header, ...rows] = parseCsv(csv).filter((row) => row.length > 1);

  const expectedHeader = "rowid,wordplay,indicator,clue_rowids";
  if (header.join(",") !== expectedHeader) {
    throw new Error(
      `Unexpected CSV header "${header.join(",")}" (expected "${expectedHeader}") — the source schema may have changed.`,
    );
  }

  const entries = rows.map(([, wordplay, indicator, clueRowids]) => ({
    wordplay: wordplay.trim().toLowerCase(),
    // Collapse internal whitespace so multi-word phrases match cleanly
    // against the whitespace-tokenized text a user types in.
    indicator: indicator.trim().toLowerCase().replace(/\s+/g, " "),
    count: countClueRefs(clueRowids),
  }));

  entries.sort(
    (a, b) => a.indicator.localeCompare(b.indicator) || a.wordplay.localeCompare(b.wordplay),
  );

  const wordplayTypes = [...new Set(entries.map((e) => e.wordplay))].sort();

  const headerComment = [
    "# Parsnip cryptic-crossword wordplay indicators",
    "#",
    '# Data: "Cryptic Crosswords" by George Ho <https://cryptics.georgeho.org>',
    "# (the `indicators` table), licensed under the Open Database License",
    "# (ODbL) v1.0 <https://opendatacommons.org/licenses/odbl/1-0/>. If you",
    "# share this file or data derived from it, you must attribute the",
    "# source and keep it under the same license (ODbL's share-alike term).",
    "#",
    `# Generated: ${new Date().toISOString()}`,
    `# Source: ${SOURCE_URL}`,
    `# Rows: ${entries.length}, wordplay types: ${wordplayTypes.join(", ")}`,
    "#",
    "# Columns (tab-separated, no header row below this comment block):",
    "#   indicator  — a lowercase word or phrase that can flag this kind of",
    "#                wordplay in a cryptic clue",
    "#   wordplay   — the kind of wordplay it can indicate",
    "#   count      — how many example clues in the source data used this",
    "#                indicator for this wordplay type (a rough measure of",
    "#                how standard/common it is)",
    "#",
    "# The same phrase can appear more than once, under different wordplay",
    "# types — many indicators are genuinely ambiguous out of context.",
    "#",
    "",
  ].join("\n");

  const body = entries
    .map((e) => `${e.indicator}\t${e.wordplay}\t${e.count}`)
    .join("\n");

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, headerComment + body + "\n", "utf-8");

  console.log(`Wrote ${entries.length} indicator entries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

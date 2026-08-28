# Parsnipia

Parsnipia is a crossword solver's friend. Eventually it will take a string of
letters — some of which may be `?` for an unknown letter — and offer:

- **Anagrams** of the letters
- **Crossword solutions**: dictionary words matching a pattern with `?`
  wildcards
- **Thesaurus lookups**: words with a similar meaning

## This version

- Enter a UK English word (optionally with `?` wildcards) and either check
  whether it's in the word store, list every word matching the pattern, or
  list every anagram of it (with `?`s as blank tiles) — the **Solve** and
  **Anagram** radio options next to Check.
- Enter a sentence and a length, and list every dictionary word of that
  length hidden in its contiguous letters once spaces are removed — the
  classic cryptic "hidden word" wordplay. Matches can cross word breaks
  (e.g. "cat" hidden in "the **ca t**errier"), and each result highlights
  exactly where it sits in the original sentence. No `?` wildcards here —
  a hidden word is whatever it is, not a pattern to fill in.
- Enter a full cryptic clue and get back a list of candidate wordplay
  strategies: every word or phrase in the clue that's a known cryptic
  indicator, highlighted in place, alongside a plain-English explanation
  of what kind of wordplay it suggests (anagram, hidden word, reversal,
  container, insertion, deletion, homophone, alternation). Ambiguous
  indicators (most of them, in practice) surface every interpretation.
  Alongside those, it also flags **letter substitutions** — words that
  themselves stand in for a letter elsewhere in the wordplay (e.g.
  "North" for N, "Five" for its Roman numeral V) — from a small,
  hand-curated lookup table meant to grow over time (see
  [`src/substitutionStore/substitutionStore.ts`](src/substitutionStore/substitutionStore.ts),
  add new ones to `COMMON_SUBSTITUTIONS` as you come across them).

## Word source

Words come from [SCOWL / ESDB](https://wordlist.aspell.net) (Kevin
Atkinson's "Spell Checker Oriented Word Lists" project), generated as a UK
English ("-ise" spelling) list via the
[on-demand wordlist builder](https://app.aspell.net/create). The list is
fetched and cleaned by [`scripts/fetch-wordlist.mjs`](scripts/fetch-wordlist.mjs)
into [`public/data/words-en-gb.txt`](public/data/words-en-gb.txt) (one
lowercase word per line), which the app fetches at runtime. See the license
notice embedded at the top of that file for full terms.

To refresh the word list (e.g. to pick up SCOWL updates, or change its size
/ variant settings):

```sh
npm run fetch-wordlist
```

## Cryptic indicator source

Wordplay indicators come from ["Cryptic Crosswords"](https://cryptics.georgeho.org)
by George Ho — a database of clues and the indicator words/phrases within
them, tagged by wordplay type — licensed under the
[Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/).
[`scripts/fetch-cryptic-indicators.mjs`](scripts/fetch-cryptic-indicators.mjs)
streams the *complete* `indicators` table (its own JSON API paginates at
100 rows, well short of the ~15,700 total — the script uses Datasette's
`?_stream=on` CSV export instead to get all of them) into
[`public/data/cryptic-indicators.tsv`](public/data/cryptic-indicators.tsv).
See the license notice embedded at the top of that file — ODbL requires
attribution and share-alike for anything built from this data. To refresh
it:

```sh
npm run fetch-cryptic-indicators
```

This one's slow (the server streams the whole table over the course of a
minute or two) — it's not part of `npm run build` or CI, only run by hand
when the source data needs refreshing.

## Development

```sh
npm install
npm run dev       # start the dev server
npm test          # run the test suite once
npm run test:watch  # run tests in watch mode
npm run build      # type-check and build for production
npm run lint       # lint with oxlint
```

Tests live in [`tests/`](tests) (mirroring the structure of `src/`), not
alongside the source files. Running `npm test` also writes
`public/tests/results.json`, which [`public/tests/index.html`](public/tests/index.html) —
a small hand-written report page, not generated — renders into a
browsable pass/fail summary. It's linked from the toolbar's "Tests" link
in the top right of the app, and links back to the app in turn. Since
`results.json` is a build artifact (gitignored), run `npm test` at least
once after cloning before opening the report locally.

## Deployment

GitHub Pages' "deploy from a branch" mode can only serve a repo's root or
its `/docs` folder — nothing else, and no build step runs on GitHub's
side. So `npm run build` builds straight into [`docs/`](docs) (see
`build.outDir` in [`vite.config.ts`](vite.config.ts)), which is committed
like any other source, and GitHub Pages serves it directly whenever
`main` is pushed. `docs/` is a build artifact, not something to hand-edit
— always regenerate it with `npm run build`, never edit it directly.

To publish a change:

```sh
npm run build   # rebuilds docs/
git add -A
git commit -m "…"
git push
```

One repo setting to check once: **Settings → Pages → Build and
deployment → Source** should be **Deploy from a branch**, branch `main`,
folder **/docs**.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push
and PR: lint, test, build, and — since nothing rebuilds `docs/` for
you — a check that a fresh build of `docs/` matches what's committed, to
catch a "forgot to rebuild before pushing" mistake before it ships a
stale site.

The site is served at `https://julianbrowne.github.io/parsnipia/` — note
that's the **GitHub repo name** (`parsnipia`), which is what `base` in
`vite.config.ts` needs to match; it's unrelated to this local folder's
name.

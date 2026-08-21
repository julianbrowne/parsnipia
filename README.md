# Parsnip

Parsnip is a crossword solver's friend. Eventually it will take a string of
letters — some of which may be `?` for an unknown letter — and offer:

- **Anagrams** of the letters
- **Crossword solutions**: dictionary words matching a pattern with `?`
  wildcards
- **Thesaurus lookups**: words with a similar meaning

## This version

The only functionality so far is the first building block: enter a UK
English word and check whether it's in the word store, or be told it isn't
a recognised word.

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

The app is built with Vite and deployed to GitHub Pages, served from
`/Parsnip/` (see `base` in [`vite.config.ts`](vite.config.ts)). Pushes to
`main` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which runs the tests, builds, and publishes `dist/` to GitHub Pages.

For this to work, set the repo's **Settings → Pages → Build and
deployment → Source** to **GitHub Actions**.

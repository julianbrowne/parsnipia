import { Toolbar } from "../Toolbar/Toolbar";
import "./About.css";

/**
 * The About page: what Parsnipia does, plus credits for every open-source
 * and free resource it's built on. Shares the same <Toolbar /> the main
 * app uses (see main.tsx for this page's own entry point).
 */
export function About() {
  return (
    <>
      <Toolbar />
      <main className="page about-page">
        <h1>About Parsnipia</h1>
        <p>
          Parsnipia is a crossword solver's friend. Enter a word — with{" "}
          <code>?</code> for any unknown letters — to check it against the
          dictionary, list every word matching that pattern, or list its
          anagrams. Enter a sentence and a length to find words hidden in its
          letters. Or enter a full cryptic clue to get back a list of
          candidate wordplay strategies: known indicators and letter
          substitutions, each highlighted in place with a plain-English
          explanation of what it suggests. Or enter a word to find others
          with a similar meaning — a thesaurus lookup, for when you know
          roughly what the answer means but not the word itself.
        </p>
        <p>
          It's a work in progress, built to grow alongside whatever comes up
          while actually solving crosswords.
        </p>

        <h2>Open source &amp; free resources used</h2>
        <ul className="credits">
          <li>
            <span className="name">React</span>
            <span className="detail">
              UI library — <a href="https://react.dev">react.dev</a> — MIT
              License
            </span>
          </li>
          <li>
            <span className="name">Vite</span>
            <span className="detail">
              Build tool — <a href="https://vite.dev">vite.dev</a> — MIT
              License
            </span>
          </li>
          <li>
            <span className="name">TypeScript</span>
            <span className="detail">
              <a href="https://www.typescriptlang.org">typescriptlang.org</a>{" "}
              — Apache License 2.0
            </span>
          </li>
          <li>
            <span className="name">Vitest</span>
            <span className="detail">
              Test runner — <a href="https://vitest.dev">vitest.dev</a> — MIT
              License
            </span>
          </li>
          <li>
            <span className="name">React Testing Library</span>
            <span className="detail">
              <a href="https://testing-library.com/react">
                testing-library.com
              </a>{" "}
              — MIT License
            </span>
          </li>
          <li>
            <span className="name">oxlint</span>
            <span className="detail">
              Linter — <a href="https://oxc.rs">oxc.rs</a> — MIT License
            </span>
          </li>
          <li>
            <span className="name">SCOWL / ESDB</span>
            <span className="detail">
              UK English word list, by Kevin Atkinson —{" "}
              <a href="https://wordlist.aspell.net">wordlist.aspell.net</a>
            </span>
          </li>
          <li>
            <span className="name">"Cryptic Crosswords" dataset</span>
            <span className="detail">
              Wordplay indicators, by George Ho —{" "}
              <a href="https://cryptics.georgeho.org">
                cryptics.georgeho.org
              </a>{" "}
              — Open Database License (ODbL) v1.0
            </span>
          </li>
          <li>
            <span className="name">Moby Thesaurus</span>
            <span className="detail">
              Thesaurus data, compiled by Grady Ward for Project Gutenberg's
              Moby lexicon project, in the public domain —{" "}
              <a href="https://github.com/words/moby">
                github.com/words/moby
              </a>
            </span>
          </li>
          <li>
            <span className="name">App icon &amp; logo</span>
            <span className="detail">
              By Smash Icons —{" "}
              <a href="https://www.flaticon.com/authors/smashicons">
                flaticon.com/authors/smashicons
              </a>
            </span>
          </li>
        </ul>
      </main>
    </>
  );
}

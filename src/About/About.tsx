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
        <h1>Parsnipia Verbum</h1>
        <p>
          Parsnipia Verbum? Yes. It's a play on Principia Mathematica, but with
          a bonus parsnip thrown in. No, it does not make any sense.
        </p>
        <p>
          The parsnipia is a handy all-in-one tool for solving crosswords, 
          created because all the others on the web seemed to have far too many
          ads or didn't quite have the right features (like search for thesaurus
          entries by length of word).
        </p>
        <p>
          That's it. Enjoy using it and if you have any suggestions please
          email us at parsnipia@webskill.com - always happy to find ways
          to improve the app.
        </p>

        <h2>Open source &amp; free resources used</h2>
        <p>
          Parsnipia comes to you via the gift of quite a few open source
          software packages and assets. Here are the main ones deserving
          a mention.
        </p>
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

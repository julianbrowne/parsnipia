import { Toolbar } from "../Toolbar/Toolbar";
import { WordLookup } from "../WordLookup/WordLookup";
import { HiddenWords } from "../HiddenWords/HiddenWords";
import { CrypticClue } from "../CrypticClue/CrypticClue";
import { FindMatchingWord } from "../FindMatchingWord/FindMatchingWord";
import { FindAWordle } from "../FindAWordle/FindAWordle";
import "./HomePage.css";

/** The main app page: the toolbar plus all five lookup features. */
export function HomePage() {
  return (
    <>
      <Toolbar />
      <main className="page">
        <section className="feature-section">
          <h2 className="section-heading">Dictionary Search</h2>
          <WordLookup />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Thesaurus Search</h2>
          <FindMatchingWord />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Solve Wordle</h2>
          <FindAWordle />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Find Hidden Words</h2>
          <HiddenWords />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Find A Strategy</h2>
          <CrypticClue />
        </section>
      </main>
    </>
  );
}

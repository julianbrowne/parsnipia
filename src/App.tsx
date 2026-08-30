import { Toolbar } from "./Toolbar/Toolbar";
import { WordLookup } from "./WordLookup/WordLookup";
import { HiddenWords } from "./HiddenWords/HiddenWords";
import { CrypticClue } from "./CrypticClue/CrypticClue";
import { FindMatchingWord } from "./FindMatchingWord/FindMatchingWord";
import "./App.css";

function App() {
  return (
    <>
      <Toolbar />
      <main className="page">
        <section className="feature-section">
          <h2 className="section-heading">Find A Word</h2>
          <WordLookup />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Find Hidden Words</h2>
          <HiddenWords />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Find A Strategy</h2>
          <CrypticClue />
        </section>
        <section className="feature-section">
          <h2 className="section-heading">Find A Matching Word</h2>
          <FindMatchingWord />
        </section>
      </main>
    </>
  );
}

export default App;

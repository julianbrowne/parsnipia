import { Toolbar } from "./Toolbar/Toolbar";
import { WordLookup } from "./WordLookup/WordLookup";
import { HiddenWords } from "./HiddenWords/HiddenWords";
import { CrypticClue } from "./CrypticClue/CrypticClue";
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
      </main>
    </>
  );
}

export default App;

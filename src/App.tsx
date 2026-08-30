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
        <WordLookup />
        <hr className="section-divider" />
        <h2 className="section-heading">Hidden words</h2>
        <HiddenWords />
        <hr className="section-divider" />
        <h2 className="section-heading">Cryptic clue strategies</h2>
        <CrypticClue />
      </main>
    </>
  );
}

export default App;

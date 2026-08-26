import { Toolbar } from "./Toolbar/Toolbar";
import { WordLookup } from "./WordLookup/WordLookup";
import { CrypticClue } from "./CrypticClue/CrypticClue";
import "./App.css";

function App() {
  return (
    <>
      <Toolbar />
      <main className="page">
        <h1>Parsnip</h1>
        <p className="tagline">A crossword solver's friend</p>
        <WordLookup />
        <hr className="section-divider" />
        <h2 className="section-heading">Cryptic clue strategies</h2>
        <CrypticClue />
      </main>
    </>
  );
}

export default App;

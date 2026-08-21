import { Toolbar } from "./Toolbar/Toolbar";
import { WordLookup } from "./WordLookup/WordLookup";
import "./App.css";

function App() {
  return (
    <>
      <Toolbar />
      <main className="page">
        <h1>Parsnip</h1>
        <p className="tagline">A crossword solver's friend</p>
        <WordLookup />
      </main>
    </>
  );
}

export default App;

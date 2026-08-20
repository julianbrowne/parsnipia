import { WordLookup } from "./WordLookup/WordLookup";
import "./App.css";

function App() {
  return (
    <>
      <h1>Parsnip</h1>
      <p className="tagline">A crossword solver's friend</p>
      <WordLookup />
    </>
  );
}

export default App;

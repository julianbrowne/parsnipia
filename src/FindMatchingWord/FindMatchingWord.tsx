import { useState, type FormEvent } from "react";
import {
  loadThesaurusStore,
  type ThesaurusStore,
} from "../thesaurusStore/thesaurusStore";
import { normalizeWord } from "../wordStore/wordStore";
import { useAsyncStore } from "../useAsyncStore/useAsyncStore";

type Result = { word: string; length?: number; synonyms: string[] } | null;

/** Cap how many synonyms we render, so a very common word doesn't flood the page. */
const MAX_DISPLAYED_SYNONYMS = 200;

export function FindMatchingWord() {
  const loadState = useAsyncStore<ThesaurusStore>(
    loadThesaurusStore,
    "Failed to load the thesaurus.",
  );
  const [input, setInput] = useState("");
  const [length, setLength] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadState.status !== "ready") return;

    const entry = normalizeWord(input);
    if (entry === "") {
      setHint("Enter a word to find matches for.");
      setResult(null);
      return;
    }

    // Length is optional here — a blank field means "any length".
    let parsedLength: number | undefined;
    if (length.trim() !== "") {
      const candidate = Number.parseInt(length, 10);
      if (!Number.isInteger(candidate) || candidate <= 0) {
        setHint("Enter a word length of 1 or more, or leave it blank for any length.");
        setResult(null);
        return;
      }
      parsedLength = candidate;
    }

    setHint(null);
    setResult({
      word: entry,
      length: parsedLength,
      synonyms: loadState.store.findSynonyms(entry, parsedLength),
    });
  }

  const isReady = loadState.status === "ready";

  return (
    <div className="find-matching-word">
      <form className="find-matching-word__form" onSubmit={handleSubmit} noValidate>
        <div className="find-matching-word__row">
          <label htmlFor="find-matching-word-input" className="visually-hidden">
            Word to find matches for
          </label>
          <input
            id="find-matching-word-input"
            className="find-matching-word__input"
            type="text"
            placeholder="Enter a word…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!isReady}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <label htmlFor="find-matching-word-length" className="visually-hidden">
            Word length (optional)
          </label>
          <input
            id="find-matching-word-length"
            className="find-matching-word__length"
            type="number"
            min={1}
            placeholder="Length"
            value={length}
            onChange={(event) => setLength(event.target.value)}
            disabled={!isReady}
          />
          <button type="submit" className="find-matching-word__submit" disabled={!isReady}>
            Find matching words
          </button>
        </div>
      </form>

      {loadState.status === "loading" && (
        <p
          role="status"
          className="find-matching-word__status find-matching-word__status--loading"
        >
          Loading thesaurus…
        </p>
      )}

      {loadState.status === "error" && (
        <p role="alert" className="find-matching-word__status find-matching-word__status--error">
          Couldn't load the thesaurus: {loadState.message}
        </p>
      )}

      {isReady && hint && (
        <p
          role="status"
          className="find-matching-word__status find-matching-word__status--warning"
        >
          {hint}
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.synonyms.length === 0 && (
        <p
          role="status"
          className="find-matching-word__status find-matching-word__status--not-found"
        >
          ✗ No matching words{result.length !== undefined ? " of that length" : ""} found for “
          {result.word}”.
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.synonyms.length > 0 && (
        <div role="status" className="find-matching-word__status find-matching-word__status--found">
          <p>
            ✓ {result.synonyms.length} word{result.synonyms.length === 1 ? "" : "s"} match “
            {result.word}”
            {result.length !== undefined ? ` (${result.length} letters)` : ""}
            {result.synonyms.length > MAX_DISPLAYED_SYNONYMS
              ? ` (showing first ${MAX_DISPLAYED_SYNONYMS})`
              : ""}
            :
          </p>
          <ul className="find-matching-word__matches">
            {result.synonyms.slice(0, MAX_DISPLAYED_SYNONYMS).map((synonym) => (
              <li key={synonym}>{synonym}</li>
            ))}
          </ul>
        </div>
      )}

      {loadState.status === "ready" && (
        <p className="find-matching-word__count">
          {loadState.store.size.toLocaleString()} word pairs loaded
        </p>
      )}
    </div>
  );
}

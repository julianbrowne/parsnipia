import { useState, type FormEvent, type ReactNode } from "react";
import {
  loadWordStore,
  findHiddenWords,
  type WordStore,
  type HiddenWordMatch,
} from "../wordStore/wordStore";
import { useAsyncStore } from "../useAsyncStore/useAsyncStore";

type Result = { sentence: string; matches: HiddenWordMatch[] } | null;

/** Cap how many hidden words we render, so a long sentence and a short length don't flood the page. */
const MAX_DISPLAYED_HIDDEN_WORDS = 200;

/** Renders `sentence` with the `[start, end)` character span highlighted. */
function HighlightedSentence({
  sentence,
  start,
  end,
}: {
  sentence: string;
  start: number;
  end: number;
}): ReactNode {
  return (
    <>
      {sentence.slice(0, start)}
      <mark className="hidden-words__highlight">{sentence.slice(start, end)}</mark>
      {sentence.slice(end)}
    </>
  );
}

export function HiddenWords() {
  const loadState = useAsyncStore<WordStore>(loadWordStore, "Failed to load the word list.");
  const [sentence, setSentence] = useState("");
  const [length, setLength] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadState.status !== "ready") return;

    if (sentence.includes("?")) {
      setHint("Wildcards (?) aren't supported here — remove them from the sentence.");
      setResult(null);
      return;
    }
    if (sentence.trim() === "") {
      setHint("Enter a sentence to search.");
      setResult(null);
      return;
    }
    const parsedLength = Number.parseInt(length, 10);
    if (!Number.isInteger(parsedLength) || parsedLength <= 0) {
      setHint("Enter a word length of 1 or more.");
      setResult(null);
      return;
    }

    setHint(null);
    setResult({ sentence, matches: findHiddenWords(loadState.store, sentence, parsedLength) });
  }

  const isReady = loadState.status === "ready";

  return (
    <div className="hidden-words">
      <form className="hidden-words__form" onSubmit={handleSubmit} noValidate>
        <div className="hidden-words__row">
          <label htmlFor="hidden-words-sentence" className="visually-hidden">
            Sentence to search
          </label>
          <input
            id="hidden-words-sentence"
            className="hidden-words__input"
            type="text"
            placeholder="Enter a sentence…"
            value={sentence}
            onChange={(event) => setSentence(event.target.value)}
            disabled={!isReady}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <label htmlFor="hidden-words-length" className="visually-hidden">
            Word length
          </label>
          <input
            id="hidden-words-length"
            className="hidden-words__length"
            type="number"
            min={1}
            placeholder="Length"
            value={length}
            onChange={(event) => setLength(event.target.value)}
            disabled={!isReady}
          />
          <button type="submit" className="hidden-words__submit" disabled={!isReady}>
            Find hidden words
          </button>
        </div>
      </form>

      {loadState.status === "loading" && (
        <p role="status" className="hidden-words__status hidden-words__status--loading">
          Loading dictionary…
        </p>
      )}

      {loadState.status === "error" && (
        <p role="alert" className="hidden-words__status hidden-words__status--error">
          Couldn't load the dictionary: {loadState.message}
        </p>
      )}

      {isReady && hint && (
        <p role="status" className="hidden-words__status hidden-words__status--warning">
          {hint}
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length === 0 && (
        <p role="status" className="hidden-words__status hidden-words__status--not-found">
          ✗ No hidden words of that length found.
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length > 0 && (
        <div role="status" className="hidden-words__results">
          <p className="hidden-words__results-count">
            ✓ {result.matches.length} hidden word{result.matches.length === 1 ? "" : "s"} found
            {result.matches.length > MAX_DISPLAYED_HIDDEN_WORDS
              ? ` (showing first ${MAX_DISPLAYED_HIDDEN_WORDS})`
              : ""}
            :
          </p>
          <ul className="hidden-words__list">
            {result.matches.slice(0, MAX_DISPLAYED_HIDDEN_WORDS).map((match) => (
              <li key={`${match.start}-${match.end}`} className="hidden-words__item">
                <span className="hidden-words__word">{match.word}</span>
                <span className="hidden-words__preview">
                  <HighlightedSentence
                    sentence={result.sentence}
                    start={match.start}
                    end={match.end}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadState.status === "ready" && (
        <p className="hidden-words__count">
          {loadState.store.size.toLocaleString()} words loaded
        </p>
      )}
    </div>
  );
}

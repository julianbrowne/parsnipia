import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { loadWordStore, type WordStore } from "../wordStore/wordStore";
import { useAsyncStore } from "../useAsyncStore/useAsyncStore";

/** Wordle words are always exactly this many letters. */
const WORD_LENGTH = 5;

type Result = {
  pattern: string;
  requiredLetters: string;
  excludedLetters: string;
  matches: string[];
} | null;

/** Cap how many matches we render, so a wide-open board doesn't flood the page. */
const MAX_DISPLAYED_MATCHES = 200;

/** Removes exactly one occurrence of `char` from `text`, if present. */
function removeFirstOccurrence(text: string, char: string): string {
  const index = text.indexOf(char);
  return index === -1 ? text : text.slice(0, index) + text.slice(index + 1);
}

export function FindAWordle() {
  const loadState = useAsyncStore<WordStore>(loadWordStore, "Failed to load the word list.");
  const [letters, setLetters] = useState<string[]>(() => Array(WORD_LENGTH).fill(""));
  const [unknownLetters, setUnknownLetters] = useState("");
  const [excludedLetters, setExcludedLetters] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<string | null>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const filledCount = letters.filter((letter) => letter !== "").length;
  const maxUnknownLength = WORD_LENGTH - filledCount;

  function handleLetterChange(index: number, rawValue: string) {
    // A box can hold at most one letter — if the browser hands back more
    // than one character (e.g. the cursor sat before existing content),
    // treat the most recently typed character as the intended one.
    const char = rawValue.slice(-1);
    if (char !== "" && !/^[a-zA-Z]$/.test(char)) {
      return; // reject anything that isn't a single letter
    }
    const upper = char.toUpperCase();

    const nextLetters = [...letters];
    nextLetters[index] = upper;
    setLetters(nextLetters);

    if (upper !== "") {
      boxRefs.current[index + 1]?.focus();

      // This letter now has a known position, so it's no longer one of
      // the "known but unknown position" letters.
      const nextFilledCount = nextLetters.filter((letter) => letter !== "").length;
      const nextMaxUnknownLength = WORD_LENGTH - nextFilledCount;
      setUnknownLetters(
        removeFirstOccurrence(unknownLetters, upper).slice(0, nextMaxUnknownLength),
      );

      // This letter is now known to be in the answer, so it can no longer
      // sit in the "known not to be in the answer" list.
      setExcludedLetters([...excludedLetters].filter((existing) => existing !== upper).join(""));
    }
  }

  function handleLetterKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && letters[index] === "" && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  function handleUnknownLettersChange(rawValue: string) {
    const filtered = rawValue.toUpperCase().replace(/[^A-Z]/g, "");
    const next = filtered.slice(0, maxUnknownLength);
    setUnknownLetters(next);

    // These letters are now known to be in the answer, so they can no
    // longer sit in the "known not to be in the answer" list.
    setExcludedLetters(
      excludedLetters
        .split("")
        .filter((char) => !next.includes(char))
        .join(""),
    );
  }

  function handleExcludedLettersChange(rawValue: string) {
    const filtered = rawValue.toUpperCase().replace(/[^A-Z]/g, "");

    // Letters already known to be in the answer — in place or not —
    // can't also be marked as known not to be in the answer.
    const knownLetters = new Set([...letters, ...unknownLetters].filter((char) => char !== ""));
    setExcludedLetters(
      filtered
        .split("")
        .filter((char) => !knownLetters.has(char))
        .join(""),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadState.status !== "ready") return;

    if (filledCount === 0 && unknownLetters === "" && excludedLetters === "") {
      setHint("Enter at least one letter, known position or not.");
      setResult(null);
      return;
    }

    setHint(null);
    const pattern = letters.map((letter) => (letter === "" ? "?" : letter)).join("");
    setResult({
      pattern,
      requiredLetters: unknownLetters,
      excludedLetters,
      matches: loadState.store.findWordleMatches(pattern, unknownLetters, excludedLetters),
    });
  }

  const isReady = loadState.status === "ready";

  return (
    <div className="find-a-wordle">
      <form className="find-a-wordle__form" onSubmit={handleSubmit} noValidate>
        <fieldset className="find-a-wordle__grid" disabled={!isReady}>
          <legend className="visually-hidden">Letters in a known position</legend>
          {letters.map((letter, index) => (
            <input
              // eslint-disable-next-line react/no-array-index-key -- the boxes are fixed positions, not a dynamic list
              key={index}
              ref={(element) => {
                boxRefs.current[index] = element;
              }}
              className="find-a-wordle__box"
              type="text"
              inputMode="text"
              maxLength={1}
              value={letter}
              onChange={(event) => handleLetterChange(index, event.target.value)}
              onKeyDown={(event) => handleLetterKeyDown(index, event)}
              disabled={!isReady}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`Letter ${index + 1}`}
            />
          ))}
        </fieldset>

        <div className="find-a-wordle__row">
          <label htmlFor="find-a-wordle-unknown" className="visually-hidden">
            Known letters with an unknown position
          </label>
          <input
            id="find-a-wordle-unknown"
            className="find-a-wordle__unknown"
            type="text"
            placeholder="known letters, any position…"
            value={unknownLetters}
            onChange={(event) => handleUnknownLettersChange(event.target.value)}
            disabled={!isReady || maxUnknownLength === 0}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className="find-a-wordle__row">
          <label htmlFor="find-a-wordle-excluded" className="visually-hidden">
            Letters known not to be in the answer
          </label>
          <input
            id="find-a-wordle-excluded"
            className="find-a-wordle__unknown"
            type="text"
            placeholder="letters not in the answer…"
            value={excludedLetters}
            onChange={(event) => handleExcludedLettersChange(event.target.value)}
            disabled={!isReady}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button type="submit" className="find-a-wordle__submit" disabled={!isReady}>
            Find Wordle matches
          </button>
        </div>
      </form>

      {loadState.status === "loading" && (
        <p role="status" className="find-a-wordle__status find-a-wordle__status--loading">
          Loading dictionary…
        </p>
      )}

      {loadState.status === "error" && (
        <p role="alert" className="find-a-wordle__status find-a-wordle__status--error">
          Couldn't load the dictionary: {loadState.message}
        </p>
      )}

      {isReady && hint && (
        <p role="status" className="find-a-wordle__status find-a-wordle__status--warning">
          {hint}
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length === 0 && (
        <p role="status" className="find-a-wordle__status find-a-wordle__status--not-found">
          ✗ No words match “{result.pattern}”
          {result.requiredLetters ? ` containing “${result.requiredLetters}”` : ""}
          {result.excludedLetters ? ` excluding “${result.excludedLetters}”` : ""}.
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length > 0 && (
        <div role="status" className="find-a-wordle__status find-a-wordle__status--found">
          <p>
            ✓ {result.matches.length} word{result.matches.length === 1 ? "" : "s"} match “
            {result.pattern}”
            {result.requiredLetters ? ` containing “${result.requiredLetters}”` : ""}
            {result.excludedLetters ? ` excluding “${result.excludedLetters}”` : ""}
            {result.matches.length > MAX_DISPLAYED_MATCHES
              ? ` (showing first ${MAX_DISPLAYED_MATCHES})`
              : ""}
            :
          </p>
          <ul className="find-a-wordle__matches">
            {result.matches.slice(0, MAX_DISPLAYED_MATCHES).map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        </div>
      )}

      {loadState.status === "ready" && (
        <p className="find-a-wordle__count">{loadState.store.size.toLocaleString()} words loaded</p>
      )}
    </div>
  );
}

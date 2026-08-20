import { useEffect, useState, type FormEvent } from "react";
import { loadWordStore, normalizeWord, type WordStore } from "../wordStore/wordStore";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; store: WordStore };

type Result = { word: string; found: boolean } | null;

export function WordLookup() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWordStore()
      .then((store) => {
        if (!cancelled) setLoadState({ status: "ready", store });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Failed to load the word list.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadState.status !== "ready") return;

    const word = normalizeWord(input);
    if (word === "") {
      setHint("Enter a word to check.");
      setResult(null);
      return;
    }

    setHint(null);
    setResult({ word, found: loadState.store.has(word) });
  }

  const isReady = loadState.status === "ready";

  return (
    <div className="word-lookup">
      <form className="word-lookup__form" onSubmit={handleSubmit}>
        <label htmlFor="word-input" className="visually-hidden">
          Word to look up
        </label>
        <input
          id="word-input"
          className="word-lookup__input"
          type="text"
          placeholder="Enter a word…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!isReady}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="word-lookup__submit" disabled={!isReady}>
          Check
        </button>
      </form>

      {loadState.status === "loading" && (
        <p role="status" className="word-lookup__status word-lookup__status--hint">
          Loading dictionary…
        </p>
      )}

      {loadState.status === "error" && (
        <p role="alert" className="word-lookup__status word-lookup__status--error">
          Couldn't load the dictionary: {loadState.message}
        </p>
      )}

      {isReady && hint && (
        <p role="status" className="word-lookup__status word-lookup__status--hint">
          {hint}
        </p>
      )}

      {loadState.status === "ready" && !hint && result && (
        <p
          role="status"
          className={
            result.found
              ? "word-lookup__status word-lookup__status--found"
              : "word-lookup__status word-lookup__status--not-found"
          }
        >
          {result.found
            ? `✓ “${result.word}” is a valid word.`
            : `✗ “${result.word}” was not found in the dictionary.`}
        </p>
      )}

      {loadState.status === "ready" && (
        <p className="word-lookup__count">
          {loadState.store.size.toLocaleString()} words loaded
        </p>
      )}
    </div>
  );
}

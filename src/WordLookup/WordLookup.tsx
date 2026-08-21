import { useEffect, useState, type FormEvent } from "react";
import { loadWordStore, normalizeWord, type WordStore } from "../wordStore/wordStore";

/**
 * The operation the Check button performs, chosen from the dropdown.
 * More (thesaurus, ...) will join these later.
 */
type Mode = "solve" | "anagram";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; store: WordStore };

type Result =
  | { kind: "single"; word: string; found: boolean }
  | { kind: "matches"; mode: Mode; input: string; matches: string[] }
  | null;

/** Copy that varies by mode when rendering a list of matches. */
const MODE_COPY: Record<Mode, { noneFound: (input: string) => string; joiner: string }> = {
  solve: {
    noneFound: (input) => `✗ No words match “${input}”.`,
    joiner: "match",
  },
  anagram: {
    noneFound: (input) => `✗ No anagrams found for “${input}”.`,
    joiner: "are anagrams of",
  },
};

/** Cap how many matches we render, so a wide-open pattern like "?????" doesn't flood the page. */
const MAX_DISPLAYED_MATCHES = 200;

export function WordLookup() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("solve");
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

    const entry = normalizeWord(input);
    if (entry === "") {
      setHint("Enter a word to check.");
      setResult(null);
      return;
    }

    setHint(null);
    const store = loadState.store;

    switch (mode) {
      case "solve":
        setResult(
          entry.includes("?")
            ? { kind: "matches", mode, input: entry, matches: store.findMatches(entry) }
            : { kind: "single", word: entry, found: store.has(entry) },
        );
        break;
      case "anagram":
        setResult({ kind: "matches", mode, input: entry, matches: store.findAnagrams(entry) });
        break;
    }
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
          placeholder="Enter a word, or use ? for unknown letters…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!isReady}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <label htmlFor="word-lookup-mode" className="visually-hidden">
          Operation
        </label>
        <select
          id="word-lookup-mode"
          className="word-lookup__select"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
          disabled={!isReady}
        >
          <option value="solve">Solve</option>
          <option value="anagram">Anagram</option>
        </select>
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

      {loadState.status === "ready" && !hint && result?.kind === "single" && (
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

      {loadState.status === "ready" && !hint && result?.kind === "matches" && (
        <div
          role="status"
          className={
            result.matches.length > 0
              ? "word-lookup__status word-lookup__status--found"
              : "word-lookup__status word-lookup__status--not-found"
          }
        >
          {result.matches.length === 0 ? (
            <p>{MODE_COPY[result.mode].noneFound(result.input)}</p>
          ) : (
            <>
              <p>
                ✓ {result.matches.length} word{result.matches.length === 1 ? "" : "s"}{" "}
                {MODE_COPY[result.mode].joiner} “{result.input}”
                {result.matches.length > MAX_DISPLAYED_MATCHES
                  ? ` (showing first ${MAX_DISPLAYED_MATCHES})`
                  : ""}
                :
              </p>
              <ul className="word-lookup__matches">
                {result.matches.slice(0, MAX_DISPLAYED_MATCHES).map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {loadState.status === "ready" && (
        <p className="word-lookup__count">
          {loadState.store.size.toLocaleString()} words loaded
        </p>
      )}
    </div>
  );
}

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  loadIndicatorStore,
  tokenizeClue,
  findIndicatorMatches,
  describeWordplay,
  type IndicatorStore,
  type ClueMatch,
} from "../indicatorStore/indicatorStore";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; store: IndicatorStore };

type Result = { tokens: string[]; matches: ClueMatch[] } | null;

/** Cap how many strategies we render, so a long clue full of common words doesn't flood the page. */
const MAX_DISPLAYED_STRATEGIES = 100;

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** Renders `tokens` with the `[start, end)` word span highlighted. */
function HighlightedClue({
  tokens,
  start,
  end,
}: {
  tokens: string[];
  start: number;
  end: number;
}): ReactNode {
  const before = tokens.slice(0, start).join(" ");
  const target = tokens.slice(start, end).join(" ");
  const after = tokens.slice(end).join(" ");
  return (
    <>
      {before && `${before} `}
      <mark className="cryptic-clue__highlight">{target}</mark>
      {after && ` ${after}`}
    </>
  );
}

export function CrypticClue() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadIndicatorStore()
      .then((store) => {
        if (!cancelled) setLoadState({ status: "ready", store });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load the indicator list.",
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

    const tokens = tokenizeClue(input);
    if (tokens.length === 0) {
      setHint("Enter a clue to analyse.");
      setResult(null);
      return;
    }

    setHint(null);
    setResult({ tokens, matches: findIndicatorMatches(loadState.store, tokens) });
  }

  const isReady = loadState.status === "ready";

  return (
    <div className="cryptic-clue">
      <form className="cryptic-clue__form" onSubmit={handleSubmit}>
        <label htmlFor="clue-input" className="visually-hidden">
          Cryptic clue
        </label>
        <input
          id="clue-input"
          className="cryptic-clue__input"
          type="text"
          placeholder="Enter a full cryptic clue…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!isReady}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="cryptic-clue__submit" disabled={!isReady}>
          Find strategies
        </button>
      </form>

      {loadState.status === "loading" && (
        <p role="status" className="cryptic-clue__status cryptic-clue__status--hint">
          Loading indicators…
        </p>
      )}

      {loadState.status === "error" && (
        <p role="alert" className="cryptic-clue__status cryptic-clue__status--error">
          Couldn't load the indicator list: {loadState.message}
        </p>
      )}

      {isReady && hint && (
        <p role="status" className="cryptic-clue__status cryptic-clue__status--hint">
          {hint}
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length === 0 && (
        <p role="status" className="cryptic-clue__status cryptic-clue__status--not-found">
          ✗ No cryptic indicators recognised in that clue (yet).
        </p>
      )}

      {loadState.status === "ready" && !hint && result && result.matches.length > 0 && (
        <div role="status" className="cryptic-clue__strategies">
          <p className="cryptic-clue__strategies-count">
            ✓ {result.matches.length}{" "}
            {result.matches.length === 1 ? "possible strategy" : "possible strategies"}
            {result.matches.length > MAX_DISPLAYED_STRATEGIES
              ? ` (showing first ${MAX_DISPLAYED_STRATEGIES})`
              : ""}
            :
          </p>
          <ul className="cryptic-clue__strategy-list">
            {result.matches.slice(0, MAX_DISPLAYED_STRATEGIES).map((match) => (
              <li
                key={`${match.startWord}-${match.endWord}-${match.wordplay}`}
                className="cryptic-clue__strategy"
              >
                <p className="cryptic-clue__preview">
                  <HighlightedClue
                    tokens={result.tokens}
                    start={match.startWord}
                    end={match.endWord}
                  />
                </p>
                <p className="cryptic-clue__explanation">
                  <strong>{capitalize(match.wordplay)}</strong> —{" "}
                  {describeWordplay(match.wordplay)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadState.status === "ready" && (
        <p className="cryptic-clue__count">
          {loadState.store.size.toLocaleString()} indicators loaded
        </p>
      )}
    </div>
  );
}

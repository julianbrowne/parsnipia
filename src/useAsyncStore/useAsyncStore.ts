// Shared "load an async data store once on mount" state machine, used by
// every component that fetches its own store (WordLookup, HiddenWords,
// CrypticClue) — they otherwise all repeat the same loading/error/ready
// bookkeeping around a different loader function.

import { useEffect, useState } from "react";

export type AsyncStoreState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; store: T };

/**
 * Calls `load` once on mount and tracks it as loading/error/ready.
 * `fallbackErrorMessage` is used if `load` rejects with something that
 * isn't an Error instance. A component unmounting before `load` settles
 * is handled — its result is simply discarded.
 */
export function useAsyncStore<T>(
  load: () => Promise<T>,
  fallbackErrorMessage: string,
): AsyncStoreState<T> {
  const [state, setState] = useState<AsyncStoreState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((store) => {
        if (!cancelled) setState({ status: "ready", store });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : fallbackErrorMessage,
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // `load` is only ever called once, on mount, by design — the effect
    // intentionally doesn't re-run if a caller passes a new function
    // reference on a later render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

// The router's shared state (see Router.tsx for the <RouterProvider> and
// <Link> components) — split into its own file since a file exporting
// both components and plain functions/values opts out of fast refresh.

import { createContext, useContext } from "react";

export interface RouterContextValue {
  /** The current URL path, e.g. "/about". */
  path: string;
  /** Navigates to `path` via the History API, without a full page reload. */
  navigate: (path: string) => void;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

export function currentPath(): string {
  return window.location.pathname;
}

/** The current path and a `navigate` function — must be called beneath a `<RouterProvider>`. */
export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}

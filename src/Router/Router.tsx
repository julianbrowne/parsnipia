// A minimal client-side router for this app's three pages (home, About,
// Tests) — just enough to swap pages without a full reload, with the
// URL and browser back/forward staying in sync. Not a general-purpose
// routing library: there's no path matching beyond exact equality, no
// nested routes, no params. If this app ever needs more than three flat
// pages, reach for a real router instead of growing this one.

import {
  useCallback,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { RouterContext, currentPath, useRouter } from "./useRouter";

/** Provides the current path and a `navigate` function to `useRouter`/`Link` anywhere beneath it. */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    function onPopState() {
      setPath(currentPath());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== currentPath()) {
      window.history.pushState({}, "", to);
    }
    setPath(to);
  }, []);

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

/**
 * A same-app navigation link: renders a real `<a href>` — so middle-click,
 * cmd/ctrl-click, and "open in new tab" all work exactly as a user
 * expects — but a plain left-click routes client-side instead of
 * reloading the page.
 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

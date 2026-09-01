import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { RouterProvider } from "../../src/Router/Router";

/**
 * Renders `ui` inside a `<RouterProvider>` — needed by any component
 * that uses `<Link>` or `useRouter()` (directly or via `<Toolbar>`),
 * since those throw if rendered outside one.
 */
export function renderWithRouter(ui: ReactElement): RenderResult {
  return render(<RouterProvider>{ui}</RouterProvider>);
}

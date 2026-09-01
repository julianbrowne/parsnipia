import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { Link, RouterProvider } from "../../src/Router/Router";
import { useRouter } from "../../src/Router/useRouter";

function CurrentPath() {
  const { path } = useRouter();
  return <span data-testid="path">{path}</span>;
}

describe("Router", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("throws when useRouter is called outside a RouterProvider", () => {
    function Bare() {
      useRouter();
      return null;
    }
    // React logs the thrown render error to console.error too — expected
    // here, so silence it for just this assertion.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(/RouterProvider/);
    consoleError.mockRestore();
  });

  it("exposes the current path from the URL", () => {
    window.history.replaceState({}, "", "/about");

    render(
      <RouterProvider>
        <CurrentPath />
      </RouterProvider>,
    );

    expect(screen.getByTestId("path")).toHaveTextContent("/about");
  });

  it("navigates client-side via Link, updating both the URL and consumers", () => {
    render(
      <RouterProvider>
        <CurrentPath />
        <Link to="/tests">Tests</Link>
      </RouterProvider>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Tests" }));

    expect(screen.getByTestId("path")).toHaveTextContent("/tests");
    expect(window.location.pathname).toBe("/tests");
  });

  it("updates the path on browser back/forward", () => {
    render(
      <RouterProvider>
        <CurrentPath />
      </RouterProvider>,
    );

    // Simulate the browser handling back/forward itself: the URL changes
    // and fires popstate, with no click ever going through Link. Wrapped
    // in act() since this dispatches straight on window, bypassing
    // fireEvent's usual act() integration.
    act(() => {
      window.history.pushState({}, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("path")).toHaveTextContent("/about");
  });

  it("lets a plain left-click be intercepted (prevented) for client-side routing", () => {
    render(
      <RouterProvider>
        <Link to="/about">About</Link>
      </RouterProvider>,
    );

    // fireEvent.click returns false when the event's default was prevented.
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "About" }));

    expect(notPrevented).toBe(false);
  });

  it("lets a modified click (cmd/ctrl/shift/alt, or a non-left button) fall through to the browser", () => {
    render(
      <RouterProvider>
        <Link to="/about">About</Link>
      </RouterProvider>,
    );

    const link = screen.getByRole("link", { name: "About" });

    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(fireEvent.click(link, { button: 1 })).toBe(true);
    // None of those should have navigated.
    expect(window.location.pathname).toBe("/");
  });

  it("calls a caller-provided onClick in addition to routing", () => {
    const onClick = vi.fn();
    render(
      <RouterProvider>
        <Link to="/about" onClick={onClick}>
          About
        </Link>
      </RouterProvider>,
    );

    fireEvent.click(screen.getByRole("link", { name: "About" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/about");
  });
});

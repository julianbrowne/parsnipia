import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import App from "../src/App";

describe("App", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("crossword\npuzzle\nparsnip\n"),
    } as Response);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    window.history.replaceState({}, "", "/");
  });

  it("renders the heading and lets a user look up a word end-to-end", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    // Not /find a word/i: that also matches the "Find a Wordle" heading.
    expect(screen.getByRole("heading", { name: "Find A Word" })).toBeInTheDocument();

    // Both WordLookup and HiddenWords show a "words loaded" count once
    // their (identical, mocked) word list has loaded.
    await screen.findAllByText(/words loaded/i);
    await user.type(screen.getByRole("textbox", { name: /word to look up/i }), "crossword");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/is a valid word/i)).toBeInTheDocument();
  });

  it("also mounts the hidden words finder", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /hidden words/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find hidden words/i }),
    ).toBeInTheDocument();
  });

  it("also mounts the cryptic clue strategy finder", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /find a strategy/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find strategies/i }),
    ).toBeInTheDocument();
  });

  it("also mounts the thesaurus finder", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /find a matching word/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find matching words/i }),
    ).toBeInTheDocument();
  });

  it("also mounts the Wordle solver", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Find a Wordle" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find wordle matches/i }),
    ).toBeInTheDocument();
  });

  it("renders the About page directly when the URL is /about", () => {
    window.history.replaceState({}, "", "/about");

    render(<App />);

    // The About page's own content repeats the toolbar's "Parsnipia
    // Verbum" title as its own heading (explaining the name is the
    // point of the page), so match on body copy unique to it instead.
    expect(screen.getByText(/play on Principia Mathematica/i)).toBeInTheDocument();
  });

  it("renders the Tests page directly when the URL is /tests", async () => {
    window.history.replaceState({}, "", "/tests");
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    render(<App />);

    expect(screen.getByRole("heading", { name: "Test Results" })).toBeInTheDocument();
    expect(await screen.findByText(/no test results found yet/i)).toBeInTheDocument();
  });

  it("navigates to About via the toolbar without a full page reload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    await user.click(screen.getByRole("link", { name: "About" }));

    expect(screen.getByText(/play on Principia Mathematica/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/about");
  });
});

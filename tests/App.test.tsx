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
  });

  it("renders the heading and lets a user look up a word end-to-end", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /find a word/i })).toBeInTheDocument();

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
});

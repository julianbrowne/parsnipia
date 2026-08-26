import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { HiddenWords } from "../../src/HiddenWords/HiddenWords";
import { createWordStore, loadWordStore } from "../../src/wordStore/wordStore";

vi.mock("../../src/wordStore/wordStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/wordStore/wordStore")>();
  return {
    ...actual,
    loadWordStore: vi.fn(),
  };
});

const mockedLoadWordStore = vi.mocked(loadWordStore);

async function enterSentenceAndLength(
  user: ReturnType<typeof userEvent.setup>,
  sentence: string,
  length: string,
) {
  if (sentence) {
    await user.type(screen.getByRole("textbox", { name: /sentence to search/i }), sentence);
  }
  if (length) {
    await user.type(screen.getByLabelText(/word length/i), length);
  }
  await user.click(screen.getByRole("button", { name: /find hidden words/i }));
}

describe("HiddenWords", () => {
  beforeEach(() => {
    mockedLoadWordStore.mockReset();
  });

  it("shows a loading message before the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {})); // never resolves
    render(<HiddenWords />);
    expect(screen.getByText(/loading dictionary/i)).toBeInTheDocument();
  });

  it("disables the form until the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {}));
    render(<HiddenWords />);
    expect(screen.getByRole("textbox", { name: /sentence to search/i })).toBeDisabled();
    expect(screen.getByLabelText(/word length/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /find hidden words/i })).toBeDisabled();
  });

  it("finds a hidden word within a single word", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat", "art"])));
    const user = userEvent.setup();
    const { container } = render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "s cat art", "3");

    expect(await screen.findByText(/2 hidden words found/i)).toBeInTheDocument();
    const words = [...container.querySelectorAll(".hidden-words__word")].map(
      (el) => el.textContent,
    );
    expect(words).toEqual(["cat", "art"]);
  });

  it("finds a hidden word that crosses a word break", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "the ca terrier", "3");

    expect(await screen.findByText(/1 hidden word found/i)).toBeInTheDocument();
    // The highlighted preview should include the space "cat" crosses.
    expect(screen.getByText(/ca t/)).toBeInTheDocument();
  });

  it("reports when no hidden words of that length are found", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "no matches here", "3");

    expect(await screen.findByText(/no hidden words of that length/i)).toBeInTheDocument();
  });

  it("rejects wildcards rather than treating ? as a blank", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "c?t is here", "3");

    expect(await screen.findByText(/wildcards.*aren't supported/i)).toBeInTheDocument();
  });

  it("prompts for a sentence when none is entered", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "", "3");

    expect(await screen.findByText(/enter a sentence/i)).toBeInTheDocument();
  });

  it("prompts for a valid length when none is entered", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<HiddenWords />);

    await screen.findByText(/words loaded/i);
    await enterSentenceAndLength(user, "the cat sat", "");

    expect(await screen.findByText(/enter a word length/i)).toBeInTheDocument();
  });

  it("shows an error if the dictionary fails to load", async () => {
    mockedLoadWordStore.mockRejectedValue(new Error("network down"));
    render(<HiddenWords />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

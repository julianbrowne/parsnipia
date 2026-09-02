import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FindAWordle } from "../../src/FindAWordle/FindAWordle";
import { createWordStore, loadWordStore } from "../../src/wordStore/wordStore";

vi.mock("../../src/wordStore/wordStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/wordStore/wordStore")>();
  return {
    ...actual,
    loadWordStore: vi.fn(),
  };
});

const mockedLoadWordStore = vi.mocked(loadWordStore);

function letterBox(n: number) {
  return screen.getByRole("textbox", { name: `Letter ${n}` });
}

function unknownField() {
  return screen.getByRole("textbox", { name: /unknown position/i });
}

describe("FindAWordle", () => {
  beforeEach(() => {
    mockedLoadWordStore.mockReset();
  });

  it("shows a loading message before the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {})); // never resolves
    render(<FindAWordle />);
    expect(screen.getByText(/loading dictionary/i)).toBeInTheDocument();
  });

  it("disables every control until the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {}));
    render(<FindAWordle />);

    for (let n = 1; n <= 5; n++) {
      expect(letterBox(n)).toBeDisabled();
    }
    expect(unknownField()).toBeDisabled();
    expect(screen.getByRole("button", { name: /find wordle matches/i })).toBeDisabled();
  });

  it("accepts only a single letter per box, uppercased", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(letterBox(1), "s");
    expect(letterBox(1)).toHaveValue("S");
  });

  it("rejects a non-letter character", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(letterBox(1), "5");
    expect(letterBox(1)).toHaveValue("");
  });

  it("auto-advances focus to the next box after a letter is entered", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(letterBox(1), "s");
    expect(letterBox(2)).toHaveFocus();
  });

  it("moves focus back to the previous box on Backspace from an empty box", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    letterBox(2).focus();
    await user.keyboard("{Backspace}");
    expect(letterBox(1)).toHaveFocus();
  });

  it("removes a letter from the unknown-position field once it's placed in the grid", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(unknownField(), "xyz");
    expect(unknownField()).toHaveValue("XYZ");

    await user.type(letterBox(1), "x");
    expect(unknownField()).toHaveValue("YZ");
  });

  it("clamps the unknown-position field to 5 minus the number of filled boxes", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(unknownField(), "abcde");
    expect(unknownField()).toHaveValue("ABCDE");

    // "z" isn't in "abcde", so nothing is removed by that rule alone —
    // but only 4 unknown-position slots remain once one box is filled.
    await user.type(letterBox(1), "z");
    expect(unknownField()).toHaveValue("ABCD");
  });

  it("disables the unknown-position field once every box is filled", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    for (const [n, char] of ["s", "t", "o", "n", "e"].entries()) {
      await user.type(letterBox(n + 1), char);
    }
    expect(unknownField()).toBeDisabled();
  });

  it("prompts for input rather than searching with nothing entered", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.click(screen.getByRole("button", { name: /find wordle matches/i }));

    expect(await screen.findByText(/enter at least one letter/i)).toBeInTheDocument();
  });

  it("finds words matching a fully-specified grid", async () => {
    mockedLoadWordStore.mockResolvedValue(
      createWordStore(new Set(["stone", "store", "scone"])),
    );
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    for (const [n, char] of ["s", "t", "o", "n", "e"].entries()) {
      await user.type(letterBox(n + 1), char);
    }
    await user.click(screen.getByRole("button", { name: /find wordle matches/i }));

    expect(await screen.findByText(/1 word match/i)).toBeInTheDocument();
    expect(screen.getByText("stone")).toBeInTheDocument();
    expect(screen.queryByText("store")).not.toBeInTheDocument();
  });

  it("finds words matching a partial grid plus unknown-position letters", async () => {
    mockedLoadWordStore.mockResolvedValue(
      createWordStore(new Set(["stone", "store", "scone", "shore"])),
    );
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(letterBox(1), "s");
    await user.type(letterBox(5), "e");
    await user.type(unknownField(), "n");
    await user.click(screen.getByRole("button", { name: /find wordle matches/i }));

    // Not /word.*match/i: "Find Wordle matches" (the submit button) also
    // matches that.
    expect(await screen.findByText(/2 words match/i)).toBeInTheDocument();
    expect(screen.getByText("stone")).toBeInTheDocument();
    expect(screen.getByText("scone")).toBeInTheDocument();
    expect(screen.queryByText("store")).not.toBeInTheDocument();
    expect(screen.queryByText("shore")).not.toBeInTheDocument();
  });

  it("reports when nothing matches", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone"])));
    const user = userEvent.setup();
    render(<FindAWordle />);

    await screen.findByText(/words loaded/i);
    await user.type(letterBox(1), "z");
    await user.click(screen.getByRole("button", { name: /find wordle matches/i }));

    expect(await screen.findByText(/no words match/i)).toBeInTheDocument();
  });

  it("shows an error if the dictionary fails to load", async () => {
    mockedLoadWordStore.mockRejectedValue(new Error("network down"));
    render(<FindAWordle />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });

  it("shows the word count once loaded", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["stone", "store"])));
    render(<FindAWordle />);

    expect(await screen.findByText(/2 words loaded/i)).toBeInTheDocument();
  });
});

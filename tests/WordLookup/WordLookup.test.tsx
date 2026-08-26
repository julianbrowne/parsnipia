import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { WordLookup } from "../../src/WordLookup/WordLookup";
import { createWordStore, loadWordStore } from "../../src/wordStore/wordStore";

vi.mock("../../src/wordStore/wordStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/wordStore/wordStore")>();
  return {
    ...actual,
    loadWordStore: vi.fn(),
  };
});

const mockedLoadWordStore = vi.mocked(loadWordStore);

describe("WordLookup", () => {
  beforeEach(() => {
    mockedLoadWordStore.mockReset();
  });

  it("shows a loading message before the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WordLookup />);
    expect(screen.getByText(/loading dictionary/i)).toBeInTheDocument();
  });

  it("disables the form until the dictionary is ready", () => {
    mockedLoadWordStore.mockReturnValue(new Promise(() => {}));
    render(<WordLookup />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: /check/i })).toBeDisabled();
  });

  it("offers Solve and Anagram radio options, with Solve selected by default", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["parsnip"])));
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    expect(screen.getByRole("radio", { name: "Solve" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Anagram" })).not.toBeChecked();
  });

  it("reports a known word as valid", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["parsnip"])));
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.type(screen.getByRole("textbox"), "PARSNIP");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/is a valid word/i)).toBeInTheDocument();
  });

  it("reports an unknown word as not found", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["parsnip"])));
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.type(screen.getByRole("textbox"), "zzyzx");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(
      await screen.findByText(/was not found in the dictionary/i),
    ).toBeInTheDocument();
  });

  it("prompts for input rather than looking up an empty word", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["parsnip"])));
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/enter a word/i)).toBeInTheDocument();
  });

  it("lists every match for a pattern containing ?", async () => {
    mockedLoadWordStore.mockResolvedValue(
      createWordStore(new Set(["cat", "cot", "cut", "dog"])),
    );
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.type(screen.getByRole("textbox"), "c?t");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/3 words match/i)).toBeInTheDocument();
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText("cot")).toBeInTheDocument();
    expect(screen.getByText("cut")).toBeInTheDocument();
    expect(screen.queryByText("dog")).not.toBeInTheDocument();
  });

  it("reports when nothing matches a pattern containing ?", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.type(screen.getByRole("textbox"), "z?z");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/no words match/i)).toBeInTheDocument();
  });

  it("finds anagrams of a word with no wildcards", async () => {
    mockedLoadWordStore.mockResolvedValue(
      createWordStore(new Set(["cat", "act", "tac", "dog"])),
    );
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.click(screen.getByRole("radio", { name: "Anagram" }));
    await user.type(screen.getByRole("textbox"), "cat");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/3 words are anagrams of/i)).toBeInTheDocument();
    expect(screen.getByText("act")).toBeInTheDocument();
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText("tac")).toBeInTheDocument();
    expect(screen.queryByText("dog")).not.toBeInTheDocument();
  });

  it("treats ? as a wildcard letter when finding anagrams", async () => {
    mockedLoadWordStore.mockResolvedValue(
      createWordStore(new Set(["cat", "act", "cot", "dog"])),
    );
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.click(screen.getByRole("radio", { name: "Anagram" }));
    await user.type(screen.getByRole("textbox"), "c?t");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/3 words are anagrams of/i)).toBeInTheDocument();
    expect(screen.getByText("act")).toBeInTheDocument();
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText("cot")).toBeInTheDocument();
    expect(screen.queryByText("dog")).not.toBeInTheDocument();
  });

  it("reports when no anagrams are found", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["cat"])));
    const user = userEvent.setup();
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    await user.click(screen.getByRole("radio", { name: "Anagram" }));
    await user.type(screen.getByRole("textbox"), "xyz");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/no anagrams found/i)).toBeInTheDocument();
  });

  it("shows an error if the dictionary fails to load", async () => {
    mockedLoadWordStore.mockRejectedValue(new Error("network down"));
    render(<WordLookup />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

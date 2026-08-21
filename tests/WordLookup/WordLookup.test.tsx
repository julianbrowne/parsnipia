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
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /check/i })).toBeDisabled();
  });

  it("offers Solve as the (only, for now) dropdown option, selected by default", async () => {
    mockedLoadWordStore.mockResolvedValue(createWordStore(new Set(["parsnip"])));
    render(<WordLookup />);

    await screen.findByText(/words loaded/i);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("solve");
    expect(screen.getByRole("option", { name: "Solve" })).toBeInTheDocument();
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

  it("shows an error if the dictionary fails to load", async () => {
    mockedLoadWordStore.mockRejectedValue(new Error("network down"));
    render(<WordLookup />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

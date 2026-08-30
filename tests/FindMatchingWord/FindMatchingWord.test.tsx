import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FindMatchingWord } from "../../src/FindMatchingWord/FindMatchingWord";
import {
  createThesaurusStore,
  loadThesaurusStore,
  parseThesaurusList,
} from "../../src/thesaurusStore/thesaurusStore";

vi.mock("../../src/thesaurusStore/thesaurusStore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/thesaurusStore/thesaurusStore")>();
  return {
    ...actual,
    loadThesaurusStore: vi.fn(),
  };
});

const mockedLoadThesaurusStore = vi.mocked(loadThesaurusStore);

function storeFrom(tsv: string) {
  return createThesaurusStore(parseThesaurusList(tsv));
}

describe("FindMatchingWord", () => {
  beforeEach(() => {
    mockedLoadThesaurusStore.mockReset();
  });

  it("shows a loading message before the thesaurus is ready", () => {
    mockedLoadThesaurusStore.mockReturnValue(new Promise(() => {})); // never resolves
    render(<FindMatchingWord />);
    expect(screen.getByText(/loading thesaurus/i)).toBeInTheDocument();
  });

  it("disables the form until the thesaurus is ready", () => {
    mockedLoadThesaurusStore.mockReturnValue(new Promise(() => {}));
    render(<FindMatchingWord />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /find matching words/i })).toBeDisabled();
  });

  it("lists every synonym for a known word", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(
      storeFrom(["happy\tglad", "happy\tfelicitous"].join("\n")),
    );
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await user.type(screen.getByRole("textbox"), "HAPPY");
    await user.click(screen.getByRole("button", { name: /find matching words/i }));

    expect(await screen.findByText(/2 words match/i)).toBeInTheDocument();
    expect(screen.getByText("glad")).toBeInTheDocument();
    expect(screen.getByText("felicitous")).toBeInTheDocument();
  });

  it("reports when no matching words are found", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(storeFrom("happy\tglad"));
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await user.type(screen.getByRole("textbox"), "zzyzx");
    await user.click(screen.getByRole("button", { name: /find matching words/i }));

    expect(await screen.findByText(/no matching words found/i)).toBeInTheDocument();
  });

  it("prompts for input rather than looking up an empty word", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(storeFrom("happy\tglad"));
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await user.click(screen.getByRole("button", { name: /find matching words/i }));

    expect(await screen.findByText(/enter a word/i)).toBeInTheDocument();
  });

  it("shows an error if the thesaurus fails to load", async () => {
    mockedLoadThesaurusStore.mockRejectedValue(new Error("network down"));
    render(<FindMatchingWord />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

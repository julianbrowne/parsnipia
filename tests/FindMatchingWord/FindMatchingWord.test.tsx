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

async function enterWordAndLength(
  user: ReturnType<typeof userEvent.setup>,
  word: string,
  length: string,
) {
  if (word) {
    await user.type(screen.getByRole("textbox"), word);
  }
  if (length) {
    await user.type(screen.getByLabelText(/word length/i), length);
  }
  await user.click(screen.getByRole("button", { name: /find matching words/i }));
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
    expect(screen.getByLabelText(/word length/i)).toBeDisabled();
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

  it("returns every matching word when no length is given", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(
      storeFrom(["happy\tglad", "happy\tfelicitous"].join("\n")),
    );
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await enterWordAndLength(user, "happy", "");

    expect(await screen.findByText(/2 words match/i)).toBeInTheDocument();
    expect(screen.getByText("glad")).toBeInTheDocument();
    expect(screen.getByText("felicitous")).toBeInTheDocument();
  });

  it("filters matches to the given length", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(
      storeFrom(["happy\tglad", "happy\tfelicitous"].join("\n")),
    );
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await enterWordAndLength(user, "happy", "4");

    expect(await screen.findByText(/1 word match/i)).toBeInTheDocument();
    expect(screen.getByText("glad")).toBeInTheDocument();
    expect(screen.queryByText("felicitous")).not.toBeInTheDocument();
  });

  it("reports no matches of that length, distinct from no matches at all", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(storeFrom("happy\tglad"));
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await enterWordAndLength(user, "happy", "99");

    expect(await screen.findByText(/no matching words of that length found/i)).toBeInTheDocument();
  });

  it("rejects a length of zero or less", async () => {
    mockedLoadThesaurusStore.mockResolvedValue(storeFrom("happy\tglad"));
    const user = userEvent.setup();
    render(<FindMatchingWord />);

    await screen.findByText(/word pairs loaded/i);
    await enterWordAndLength(user, "happy", "0");

    expect(await screen.findByText(/enter a word length of 1 or more/i)).toBeInTheDocument();
  });

  it("shows an error if the thesaurus fails to load", async () => {
    mockedLoadThesaurusStore.mockRejectedValue(new Error("network down"));
    render(<FindMatchingWord />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

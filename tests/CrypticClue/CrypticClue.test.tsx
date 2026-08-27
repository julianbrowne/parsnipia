import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CrypticClue } from "../../src/CrypticClue/CrypticClue";
import { createIndicatorStore, loadIndicatorStore, parseIndicatorList } from "../../src/indicatorStore/indicatorStore";

vi.mock("../../src/indicatorStore/indicatorStore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/indicatorStore/indicatorStore")>();
  return {
    ...actual,
    loadIndicatorStore: vi.fn(),
  };
});

const mockedLoadIndicatorStore = vi.mocked(loadIndicatorStore);

function storeFrom(tsv: string) {
  return createIndicatorStore(parseIndicatorList(tsv));
}

describe("CrypticClue", () => {
  beforeEach(() => {
    mockedLoadIndicatorStore.mockReset();
  });

  it("shows a loading message before the indicator list is ready", () => {
    mockedLoadIndicatorStore.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CrypticClue />);
    expect(screen.getByText(/loading indicators/i)).toBeInTheDocument();
  });

  it("disables the form until the indicator list is ready", () => {
    mockedLoadIndicatorStore.mockReturnValue(new Promise(() => {}));
    render(<CrypticClue />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /find strategies/i })).toBeDisabled();
  });

  it("prompts for input rather than searching an empty clue", async () => {
    mockedLoadIndicatorStore.mockResolvedValue(storeFrom("mixed\tanagram\t12"));
    const user = userEvent.setup();
    render(<CrypticClue />);

    await screen.findByText(/indicators loaded/i);
    await user.click(screen.getByRole("button", { name: /find strategies/i }));

    expect(await screen.findByText(/enter a clue/i)).toBeInTheDocument();
  });

  it("finds and explains a matching indicator, with the clue highlighted", async () => {
    mockedLoadIndicatorStore.mockResolvedValue(storeFrom("mixed\tanagram\t12"));
    const user = userEvent.setup();
    render(<CrypticClue />);

    await screen.findByText(/indicators loaded/i);
    await user.type(screen.getByRole("textbox"), "Drink mixed up");
    await user.click(screen.getByRole("button", { name: /find strategies/i }));

    expect(await screen.findByText(/1 possible strategy/i)).toBeInTheDocument();
    expect(screen.getByText("mixed")).toBeInTheDocument();
    expect(screen.getByText(/anagram/i)).toBeInTheDocument();
    expect(screen.getByText(/jumbled/i)).toBeInTheDocument();
  });

  it("lists every wordplay type for an ambiguous indicator", async () => {
    mockedLoadIndicatorStore.mockResolvedValue(
      storeFrom(["odd\talternation\t1", "odd\tanagram\t2"].join("\n")),
    );
    const user = userEvent.setup();
    render(<CrypticClue />);

    await screen.findByText(/indicators loaded/i);
    await user.type(screen.getByRole("textbox"), "odd");
    await user.click(screen.getByRole("button", { name: /find strategies/i }));

    expect(await screen.findByText(/2 possible strategies/i)).toBeInTheDocument();
    expect(screen.getByText(/^Anagram$/)).toBeInTheDocument();
    expect(screen.getByText(/^Alternation$/)).toBeInTheDocument();
  });

  it("finds a letter substitution alongside any wordplay strategies", async () => {
    mockedLoadIndicatorStore.mockResolvedValue(storeFrom("mixed\tanagram\t12"));
    const user = userEvent.setup();
    render(<CrypticClue />);

    await screen.findByText(/indicators loaded/i);
    await user.type(screen.getByRole("textbox"), "Head North for the border");
    await user.click(screen.getByRole("button", { name: /find strategies/i }));

    expect(await screen.findByText(/1 possible letter substitution/i)).toBeInTheDocument();
    expect(screen.getByText("North")).toBeInTheDocument();
    expect(screen.getByText(/can stand in for/i)).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("reports when no indicators are recognised", async () => {
    mockedLoadIndicatorStore.mockResolvedValue(storeFrom("mixed\tanagram\t12"));
    const user = userEvent.setup();
    render(<CrypticClue />);

    await screen.findByText(/indicators loaded/i);
    await user.type(screen.getByRole("textbox"), "plain sailing");
    await user.click(screen.getByRole("button", { name: /find strategies/i }));

    expect(
      await screen.findByText(/no cryptic indicators or substitutions recognised/i),
    ).toBeInTheDocument();
  });

  it("shows an error if the indicator list fails to load", async () => {
    mockedLoadIndicatorStore.mockRejectedValue(new Error("network down"));
    render(<CrypticClue />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });
});

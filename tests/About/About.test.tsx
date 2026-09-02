import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { About } from "../../src/About/About";
import { renderWithRouter } from "../testUtils/renderWithRouter";

describe("About", () => {
  it("shows the shared toolbar", () => {
    renderWithRouter(<About />);

    // Scoped to the toolbar specifically: the page's own content also
    // has a "Parsnipia Verbum" heading (see below), so the plain query
    // would match both.
    const toolbar = screen.getByRole("banner");
    expect(within(toolbar).getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
  });

  it("shows the about heading and intro", () => {
    renderWithRouter(<About />);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    expect(screen.getByText(/play on Principia Mathematica/i)).toBeInTheDocument();
  });

  it("credits every open-source and free resource used", () => {
    renderWithRouter(<About />);

    for (const name of [
      "React",
      "Vite",
      "TypeScript",
      "Vitest",
      "React Testing Library",
      "oxlint",
      "SCOWL / ESDB",
      '"Cryptic Crosswords" dataset',
      "Moby Thesaurus",
      "App icon & logo",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});

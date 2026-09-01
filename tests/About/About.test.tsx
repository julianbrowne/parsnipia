import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { About } from "../../src/About/About";
import { renderWithRouter } from "../testUtils/renderWithRouter";

describe("About", () => {
  it("shows the shared toolbar", () => {
    renderWithRouter(<About />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
  });

  it("shows the about heading and intro", () => {
    renderWithRouter(<About />);

    expect(screen.getByRole("heading", { name: "About Parsnipia" })).toBeInTheDocument();
    expect(screen.getByText(/enter a word — with/i)).toBeInTheDocument();
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

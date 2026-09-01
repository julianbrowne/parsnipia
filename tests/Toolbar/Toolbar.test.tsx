import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, afterEach } from "vitest";
import { Toolbar } from "../../src/Toolbar/Toolbar";
import { renderWithRouter } from "../testUtils/renderWithRouter";

describe("Toolbar", () => {
  afterEach(() => {
    // Link navigation pushes real history entries — reset between tests
    // so one test's navigation can't leak into the next.
    window.history.replaceState({}, "", "/");
  });

  it("shows the logo and the centered title and tagline", () => {
    renderWithRouter(<Toolbar />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    expect(screen.getByText("the crossword solver's friend")).toBeInTheDocument();

    // Decorative: empty alt, since the adjacent heading already names the
    // app for screen readers — so this is queried by attribute, not role.
    const logo = screen.getByAltText("");
    expect(logo).toHaveAttribute("src", "/assets/images/parsnipia-logo.png");
  });

  it("links the logo back to the main page", () => {
    renderWithRouter(<Toolbar />);

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("keeps the menu closed until the button is clicked", () => {
    renderWithRouter(<Toolbar />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tests" })).not.toBeInTheDocument();
  });

  it("opens the menu to reveal About and Tests links", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(screen.getByRole("button", { name: /menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Tests" })).toHaveAttribute("href", "/tests");
  });

  it("closes the menu when the button is clicked again", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Toolbar />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);
    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside it", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <div>
        <Toolbar />
        <button type="button">Elsewhere</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("navigates client-side and closes the menu after following a link", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    await user.click(screen.getByRole("link", { name: "About" }));

    expect(screen.getByRole("button", { name: /menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    // A real navigation isn't implemented in jsdom (and would fail the
    // test if attempted) — the URL updating client-side is proof the
    // click routed instead of trying to load another document.
    expect(window.location.pathname).toBe("/about");
  });
});

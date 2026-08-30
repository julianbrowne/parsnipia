import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Toolbar } from "../../src/Toolbar/Toolbar";

describe("Toolbar", () => {
  it("shows the logo and the centered title and tagline", () => {
    render(<Toolbar />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    expect(screen.getByText("the crossword solver's friend")).toBeInTheDocument();

    // Decorative: empty alt, since the adjacent heading already names the
    // app for screen readers — so this is queried by attribute, not role.
    const logo = screen.getByAltText("");
    expect(logo).toHaveAttribute("src", "/assets/images/parsnipia-logo.png");
  });

  it("links the logo back to the main page", () => {
    render(<Toolbar />);

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("keeps the menu closed until the button is clicked", () => {
    render(<Toolbar />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tests" })).not.toBeInTheDocument();
  });

  it("opens the menu to reveal About and Tests links", async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(screen.getByRole("button", { name: /menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about/index.html",
    );
    expect(screen.getByRole("link", { name: "Tests" })).toHaveAttribute(
      "href",
      "/tests/index.html",
    );
  });

  it("closes the menu when the button is clicked again", async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    await user.click(menuButton);
    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside it", async () => {
    const user = userEvent.setup();
    render(
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
    render(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("closes the menu after following a link", async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    await user.click(screen.getByRole("link", { name: "About" }));

    expect(screen.getByRole("button", { name: /menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

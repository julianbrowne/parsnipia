import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "../../src/Toolbar/Toolbar";

describe("Toolbar", () => {
  it("links to the test report", () => {
    render(<Toolbar />);

    const link = screen.getByRole("link", { name: "Tests" });
    expect(link).toHaveAttribute("href", "/tests/index.html");
  });
});

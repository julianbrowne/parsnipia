import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ClearableInput } from "../../src/ClearableInput/ClearableInput";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <ClearableInput
      aria-label="field"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClear={() => setValue("")}
    />
  );
}

describe("ClearableInput", () => {
  it("shows the clear button only with text, and clicking it empties and focuses the input", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("field");
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();

    await user.type(input, "parsnip");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });
});

import { screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { TestResults } from "../../src/TestResults/TestResults";
import { renderWithRouter } from "../testUtils/renderWithRouter";

describe("TestResults", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows the shared toolbar and page heading", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, testResults: [] }),
    } as Response);

    renderWithRouter(<TestResults />);

    expect(screen.getByRole("heading", { name: "Parsnipia Verbum" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Test Results" })).toBeInTheDocument();
  });

  it("shows a friendly message when no results have been generated yet", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    renderWithRouter(<TestResults />);

    expect(await screen.findByText(/no test results found yet/i)).toBeInTheDocument();
  });

  it("shows the summary and each file's tests once results load", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          numTotalTests: 2,
          numPassedTests: 1,
          numFailedTests: 1,
          startTime: 1_700_000_000_000,
          testResults: [
            {
              name: "/repo/tests/Example/Example.test.tsx",
              assertionResults: [
                { status: "passed", title: "does the happy thing", fullName: "Example does the happy thing" },
                {
                  status: "failed",
                  title: "does the sad thing",
                  fullName: "Example does the sad thing",
                  failureMessages: ["Expected true, got false"],
                },
              ],
            },
          ],
        }),
    } as Response);

    renderWithRouter(<TestResults />);

    expect(await screen.findByText("1 / 2 tests passed (1 failed)")).toBeInTheDocument();
    expect(screen.getByText("tests/Example/Example.test.tsx")).toBeInTheDocument();
    expect(screen.getByText("Example does the happy thing")).toBeInTheDocument();
    expect(screen.getByText("Example does the sad thing")).toBeInTheDocument();
    expect(screen.getByText("Expected true, got false")).toBeInTheDocument();
  });
});

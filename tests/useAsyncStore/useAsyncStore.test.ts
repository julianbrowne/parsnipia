import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsyncStore } from "../../src/useAsyncStore/useAsyncStore";

describe("useAsyncStore", () => {
  it("starts in the loading state", () => {
    const { result } = renderHook(() => useAsyncStore(() => new Promise(() => {}), "fallback"));
    expect(result.current).toEqual({ status: "loading" });
  });

  it("transitions to ready with the resolved value", async () => {
    const { result } = renderHook(() =>
      useAsyncStore(() => Promise.resolve({ words: 3 }), "fallback"),
    );

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ready", store: { words: 3 } });
    });
  });

  it("transitions to error with the rejection's message", async () => {
    const { result } = renderHook(() =>
      useAsyncStore(() => Promise.reject(new Error("network down")), "fallback"),
    );

    await waitFor(() => {
      expect(result.current).toEqual({ status: "error", message: "network down" });
    });
  });

  it("falls back to the given message when the rejection isn't an Error", async () => {
    const { result } = renderHook(() =>
      useAsyncStore(() => Promise.reject("plain string rejection"), "Failed to load."),
    );

    await waitFor(() => {
      expect(result.current).toEqual({ status: "error", message: "Failed to load." });
    });
  });

  it("only calls load once, even across re-renders", async () => {
    let calls = 0;
    const load = () => {
      calls++;
      return Promise.resolve("ok");
    };
    const { result, rerender } = renderHook(() => useAsyncStore(load, "fallback"));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ready", store: "ok" });
    });

    rerender();
    rerender();
    expect(calls).toBe(1);
  });

  it("ignores a late resolution after unmount", async () => {
    let resolveLoad: (value: string) => void = () => {};
    const load = () =>
      new Promise<string>((resolve) => {
        resolveLoad = resolve;
      });

    const { result, unmount } = renderHook(() => useAsyncStore(load, "fallback"));
    expect(result.current).toEqual({ status: "loading" });

    unmount();
    resolveLoad("too late");

    // Give any (incorrect) post-unmount state update a chance to happen.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current).toEqual({ status: "loading" });
  });
});

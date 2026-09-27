// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { Corridor } from "../components/synclium/Corridor";

/**
 * Regression test for the production crash:
 * "TypeError: Cannot read properties of undefined (reading 'label')"
 * in the border corridor's gate readout.
 *
 * Root cause: rAF timestamps mark frame start and can predate the
 * performance.now() captured when the loop was armed, yielding a negative
 * dt on the very first frame. `(0 + negative/9) % 1` stays negative, so the
 * stage index computed to -1 and STAGES[-1].label threw during render —
 * unmounting the whole journey on load.
 *
 * This test simulates exactly that first frame (rAF timestamp earlier than
 * performance.now()) and asserts the corridor renders GATE 1/6 instead of
 * throwing. Verified to FAIL against the pre-fix component.
 */
describe("Corridor vsync-behind first frame", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let rafCallbacks: Array<FrameRequestCallback> = [];

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    rafCallbacks = [];

    // Do NOT mock performance.now: happy-dom internals rely on a live clock.
    // Instead, the skewed timestamp is derived from the real clock below —
    // the rAF frame-start timestamp predates effect time, as on real vsync.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders GATE 1/6 instead of crashing on a behind-schedule first frame", () => {
    // Capture the real clock just before mount; the effect arms the loop at
    // ~this time, so firing the first frame 5ms earlier reproduces vsync skew.
    const effectTime = performance.now();
    expect(() => {
      act(() => {
        root = createRoot(container);
        root.render(<Corridor />);
      });
      // Fire the armed rAF callback with the skewed (earlier) timestamp.
      // Snapshot the queue first: each fired tick re-arms via the stub, and
      // iterating the live array would never terminate.
      act(() => {
        const pending = rafCallbacks.splice(0, rafCallbacks.length);
        for (const cb of pending) cb(effectTime - 5);
      });
    }).not.toThrow();

    expect(container.textContent).toContain("GATE 1/6");
  });
});

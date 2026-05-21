import { describe, it, expect, vi } from "vitest";
import { createCell } from "../src/core/cell.js";
import { Lens } from "../src/core/lens.js";

describe("Lens Derived State", () => {
  it("should compute and cache values", () => {
    const cell = createCell("Alice");
    let computeCount = 0;
    
    const lens = new Lens("test-lens", () => {
      computeCount++;
      return cell.get().toUpperCase();
    });

    // Passive read 1 (no subscribers)
    expect(lens.get()).toBe("ALICE");
    expect(computeCount).toBe(1);

    // Passive read 2 (should read cached since cell version hasn't changed)
    expect(lens.get()).toBe("ALICE");
    expect(computeCount).toBe(1);

    // Update dependency cell
    cell.set("Bob");
    expect(lens.get()).toBe("BOB");
    expect(computeCount).toBe(2);
  });

  it("should dynamically track dependencies (conditional branching)", () => {
    const toggle = createCell(true);
    const cellA = createCell("A");
    const cellB = createCell("B");
    let computeCount = 0;

    const lens = new Lens("conditional", () => {
      computeCount++;
      return toggle.get() ? cellA.get() : cellB.get();
    });

    // Hook up listener so it enters Active state
    const listener = vi.fn();
    const unsubscribe = lens.subscribe(listener);

    expect(lens.get()).toBe("A");
    expect(computeCount).toBe(1);

    // Update cellB (currently not a dependency, should NOT recompute)
    cellB.set("B-new");
    expect(listener).not.toHaveBeenCalled();
    expect(computeCount).toBe(1);

    // Update cellA (current active dependency, SHOULD recompute and notify)
    cellA.set("A-new");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(lens.get()).toBe("A-new");
    expect(computeCount).toBe(2);

    // Toggle conditional check
    toggle.set(false);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(lens.get()).toBe("B-new");
    expect(computeCount).toBe(3);

    // Now cellA is NO LONGER a dependency. Updating it should NOT recompute or notify.
    cellA.set("A-newest");
    expect(listener).toHaveBeenCalledTimes(2); // Still 2
    expect(computeCount).toBe(3); // Still 3

    // cellB IS the active dependency. Updating it should notify and recompute.
    cellB.set("B-newest");
    expect(listener).toHaveBeenCalledTimes(3);
    expect(lens.get()).toBe("B-newest");
    expect(computeCount).toBe(4);

    unsubscribe();
  });

  it("should clean up dependency subscriptions when entering passive state", () => {
    const cell = createCell(10);
    const lens = new Lens("test", () => cell.get() * 2);

    // Start passive: zero subscriptions to cell
    // Let's activate it
    const listener = vi.fn();
    const unsubscribe = lens.subscribe(listener);

    // cell should have 1 listener (the lens)
    cell.set(20);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(lens.get()).toBe(40);

    // Unsubscribe (transitions to passive)
    unsubscribe();

    // Updating cell should no longer notify lens (because lens is passive and unsubscribed from cell)
    cell.set(30);
    expect(listener).toHaveBeenCalledTimes(1); // Still 1
  });

  it("should support multi-lens graph dependency tracking (DAG)", () => {
    const cell = createCell("Alice");
    
    // Lens 1 reads from Cell
    const upperLens = new Lens("upper", () => cell.get().toUpperCase());
    
    // Lens 2 reads from Lens 1
    const prefixLens = new Lens("prefix", () => `Hello, ${upperLens.get()}!`);

    // Verify passive read
    expect(prefixLens.get()).toBe("Hello, ALICE!");

    // Subscribe to Lens 2 (Active mode)
    const listener = vi.fn();
    const unsubscribe = prefixLens.subscribe(listener);

    // Update the base cell
    cell.set("Bob");

    // Both lenses should update, and the listener should be notified
    expect(listener).toHaveBeenCalledTimes(1);
    expect(prefixLens.get()).toBe("Hello, BOB!");

    unsubscribe();
  });
});

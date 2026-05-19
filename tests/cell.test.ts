import { describe, it, expect, vi } from "vitest";
import { createCell } from "../src/core/cell.js";

describe("Cell Core", () => {
  it("should hold and return the initial value", () => {
    const cell = createCell("Alice");
    expect(cell.get()).toBe("Alice");
  });

  it("should update value and increment version on set()", () => {
    const cell = createCell("Alice");
    const initialVersion = cell.getVersion();

    cell.set("Bob");
    expect(cell.get()).toBe("Bob");
    expect(cell.getVersion()).toBeGreaterThan(initialVersion);
  });

  it("should NOT increment version or notify if value is identical", () => {
    const cell = createCell("Alice");
    const initialVersion = cell.getVersion();
    const listener = vi.fn();
    
    cell.subscribe(listener);
    cell.set("Alice");

    expect(cell.getVersion()).toBe(initialVersion);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should notify subscribers when value changes", () => {
    const cell = createCell(10);
    const listener = vi.fn();
    
    const unsubscribe = cell.subscribe(listener);
    cell.set(20);

    expect(listener).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    cell.set(30);
    expect(listener).toHaveBeenCalledTimes(1); // No new calls after unsub
  });
});

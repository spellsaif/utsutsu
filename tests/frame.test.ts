import { describe, it, expect, vi } from "vitest";
import { createCell } from "../src/core/cell.js";
import { Lens } from "../src/core/lens.js";
import { frame } from "../src/core/frame.js";
import { createUtsutsu } from "../src/core/store.js";

describe("Frame Update Batching", () => {
  it("should batch multiple updates to a single notification wave", () => {
    const nameCell = createCell("Alice");
    const ageCell = createCell(30);

    const fullInfo = new Lens("fullInfo", () => `${nameCell.get()} (${ageCell.get()})`);
    
    const listener = vi.fn();
    fullInfo.subscribe(listener);

    // Initial read
    expect(fullInfo.get()).toBe("Alice (30)");

    // Batch writes inside a frame
    frame(() => {
      nameCell.set("Bob");
      ageCell.set(31);
      // Value shouldn't change listener calls inside frame yet
      expect(listener).not.toHaveBeenCalled();
    });

    // Output should be updated and listener called EXACTLY once, not twice
    expect(listener).toHaveBeenCalledTimes(1);
    expect(fullInfo.get()).toBe("Bob (31)");
  });

  it("should support store.frame() and nested frames", () => {
    const store = createUtsutsu({ count: 0, text: "" });
    const countLens = store.lens("count", s => s.count);

    const listener = vi.fn();
    countLens.subscribe(listener);

    // Read to register subscription
    countLens.get();

    // Nested frames should only trigger notification at the outermost boundary exit
    store.frame(() => {
      store.rootCell.set({ ...store.get(), count: 1 });
      
      store.frame(() => {
        store.rootCell.set({ ...store.get(), count: 2 });
      });

      expect(listener).not.toHaveBeenCalled();
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(countLens.get()).toBe(2);
  });
});

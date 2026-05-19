import { describe, it, expect } from "vitest";
import { createUtsutsu } from "../src/index.js";

describe("UtsutsuStore Advanced Features & Safety", () => {
  it("should successfully mount a sub-store slice", () => {
    const store = createUtsutsu({ rootVal: 1 });
    const slice = store.mount("sliceA", { sliceVal: "hello" });

    expect((store.get() as any).sliceA.sliceVal).toBe("hello");
    expect(slice.get().sliceVal).toBe("hello");
  });

  it("should throw a runtime error when mounting a duplicate key", () => {
    const store = createUtsutsu({ rootVal: 1 });
    store.mount("sliceA", { sliceVal: "hello" });

    // Attempting to mount on duplicate key should fail and throw
    expect(() => {
      store.mount("sliceA", { anotherVal: "world" });
    }).toThrow('State key "sliceA" is already registered in store.');
  });

  it("should successfully unmount a sub-store slice and clean up state", () => {
    const store = createUtsutsu({ rootVal: 1 });
    store.mount("sliceA", { sliceVal: "hello" });

    expect((store.get() as any).sliceA).toBeDefined();

    store.unmount("sliceA");
    expect((store.get() as any).sliceA).toBeUndefined();
  });

  it("should synchronize changes unidirectionally downstream from parent to child", () => {
    const store = createUtsutsu({ rootVal: 1 });
    const slice = store.mount("sliceA", { sliceVal: "hello" });

    // Directly set state in the parent store
    store.frame(() => {
      const parentState = store.get();
      (parentState as any).sliceA = { sliceVal: "changed downstream" };
      // Normally state is updated immutably, but since we are modifying state shape, we set it on root:
      store.intent("updateParent", () => ({
        ...parentState,
        sliceA: { sliceVal: "changed downstream" }
      }))();
    });

    expect(slice.get().sliceVal).toBe("changed downstream");
  });
});

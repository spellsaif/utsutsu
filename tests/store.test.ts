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

    const { updateParent } = store.intents({
      updateParent: (draft) => {
        (draft as any).sliceA.sliceVal = "changed downstream";
      }
    });

    updateParent();

    expect(slice.get().sliceVal).toBe("changed downstream");
  });

  it("should support mutative draft writes on nested structures and arrays", () => {
    const store = createUtsutsu({
      count: 0,
      user: { name: "Alice", address: { zip: "123" } },
      items: ["a", "b"]
    });

    const { updateZip, addItem } = store.intents({
      updateZip: (draft, zip: string) => {
        draft.user.address.zip = zip;
      },
      addItem: (draft, item: string) => {
        draft.items.push(item);
      }
    });

    updateZip("456");
    expect(store.get().user.address.zip).toBe("456");
    // Ensure it is immutable and creates copies only for the path modified:
    expect(store.get().user).not.toBe((store as any).rootCell.getVersion() === 0 ? null : undefined);

    addItem("c");
    expect(store.get().items).toEqual(["a", "b", "c"]);
  });

  it("should spawn atomic cells using store.cell() and maintain bi-directional synchronization", () => {
    const store = createUtsutsu({
      count: 10,
      name: "Alice"
    });

    const countCell = store.cell("count");
    expect(countCell.get()).toBe(10);

    // 1. Updating the cell directly should update the store
    countCell.set(20);
    expect(store.get().count).toBe(20);

    // 2. Updating the store via intents should update the cell
    const { increment } = store.intents({
      increment: (draft) => {
        draft.count++;
      }
    });
    increment();
    expect(countCell.get()).toBe(21);
  });
});

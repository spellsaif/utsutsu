import { describe, it, expect, vi } from "vitest";
import { createUtsutsu, connectDevTools } from "../src/index.js";

describe("DevTools Integration", () => {
  it("should do nothing when DevTools extension is not installed", () => {
    const originalWindow = global.window;
    try {
      // Simulate no window or no extension in Node environment
      (global as any).window = undefined;
      const store = createUtsutsu({ count: 0 });
      const disconnect = connectDevTools(store);
      expect(typeof disconnect).toBe("function");
      expect(() => disconnect()).not.toThrow();
    } finally {
      global.window = originalWindow;
    }
  });

  it("should initialize devtools and report intent dispatches", () => {
    const mockDevToolsConnection = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(() => () => {})
    };

    const mockExtension = {
      connect: vi.fn(() => mockDevToolsConnection)
    };

    const originalWindow = global.window;
    try {
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: mockExtension
      };

      const store = createUtsutsu({ count: 0 });
      const { increment } = store.intents({
        increment: (draft) => {
          draft.count++;
        }
      });

      const disconnect = connectDevTools(store, { name: "Test Store" });

      // Verify connection was initialized
      expect(mockExtension.connect).toHaveBeenCalledWith(expect.objectContaining({ name: "Test Store" }));
      expect(mockDevToolsConnection.init).toHaveBeenCalledWith({ count: 0 });

      // Run increment intent
      increment();

      // Verify send was called with the correct action name and state
      expect(mockDevToolsConnection.send).toHaveBeenCalledWith(
        { type: "increment", payload: [] },
        { count: 1 }
      );

      disconnect();
    } finally {
      global.window = originalWindow;
    }
  });

  it("should support time travel jumping from DevTools", () => {
    let devtoolsListener: ((msg: any) => void) | null = null;
    const mockDevToolsConnection = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn((listener) => {
        devtoolsListener = listener;
        return () => {};
      })
    };

    const mockExtension = {
      connect: vi.fn(() => mockDevToolsConnection)
    };

    const originalWindow = global.window;
    try {
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: mockExtension
      };

      const store = createUtsutsu({ count: 0 });
      connectDevTools(store);

      expect(devtoolsListener).toBeDefined();

      // Simulate a JUMP_TO_STATE dispatch from Redux DevTools
      devtoolsListener!({
        type: "DISPATCH",
        payload: { type: "JUMP_TO_STATE" },
        state: JSON.stringify({ count: 42 })
      });

      // Verify state was jumped
      expect(store.get().count).toBe(42);
    } finally {
      global.window = originalWindow;
    }
  });
});

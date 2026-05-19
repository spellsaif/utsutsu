// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { createUtsutsu } from "../src/index.js";
import { useValue } from "../src/react/index.js";

describe("React Integration", () => {
  it("should successfully subscribe components to state handles", () => {
    // 1. Define model
    const store = createUtsutsu({
      count: 0,
      user: { name: "Alice" }
    });

    // 2. Define lenses & intents
    const nameLens = store.lens("name", s => s.user.name);
    const increment = store.intent("increment", s => ({ ...s, count: s.count + 1 }));
    const rename = store.intent("rename", (s, nextName: string) => ({
      ...s,
      user: { ...s.user, name: nextName }
    }));

    // 3. Define React Component
    let renderCount = 0;
    function UserProfile() {
      renderCount++;
      const name = useValue(nameLens);
      return (
        <div>
          <span data-testid="username">{name}</span>
          <button data-testid="btn-rename" onClick={() => rename("Bob")}>Rename</button>
          <button data-testid="btn-noop" onClick={() => increment()}>Increment (Noop for profile)</button>
        </div>
      );
    }

    // 4. Render
    const { getByTestId } = render(<UserProfile />);
    expect(getByTestId("username").textContent).toBe("Alice");
    expect(renderCount).toBe(1);

    // 5. Fire rename action (Profile should rerender)
    fireEvent.click(getByTestId("btn-rename"));
    expect(getByTestId("username").textContent).toBe("Bob");
    expect(renderCount).toBe(2);

    // 6. Fire increment action (Does not affect profile name lens, should NOT rerender profile)
    fireEvent.click(getByTestId("btn-noop"));
    expect(renderCount).toBe(2); // Still 2! Rerender prevented by precise lens dependency graph!
  });

  it("should support dynamic mounting and compose slices correctly in components", () => {
    const store = createUtsutsu({ count: 10 });
    
    // Dynamic mount slice
    const dynamicSlice = store.mount("dynamic", {
      text: "hello"
    });

    const textLens = dynamicSlice.lens("text", s => s.text);
    const updateText = dynamicSlice.intent("updateText", (s, text: string) => ({ ...s, text }));

    function Editor() {
      const text = useValue(textLens);
      return (
        <div>
          <span data-testid="text">{text}</span>
          <button data-testid="btn-update" onClick={() => updateText("world")}>Update</button>
        </div>
      );
    }

    const { getByTestId } = render(<Editor />);
    expect(getByTestId("text").textContent).toBe("hello");

    fireEvent.click(getByTestId("btn-update"));
    expect(getByTestId("text").textContent).toBe("world");

    // Parent store should have combined state
    expect((store.get() as any).dynamic.text).toBe("world");
  });
});

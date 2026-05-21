// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { createUtsutsu, UtsutsuProvider } from "../src/index.js";
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
    const { increment, rename } = store.intents({
      increment: (draft) => {
        draft.count++;
      },
      rename: (draft, nextName: string) => {
        draft.user.name = nextName;
      }
    });

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
    const { updateText } = dynamicSlice.intents({
      updateText: (draft, text: string) => {
        draft.text = text;
      }
    });

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

  it("should support UtsutsuProvider and resolve handles dynamically using selector functions", () => {
    const store = createUtsutsu({
      todos: [
        { id: 1, text: "Buy milk", done: false }
      ]
    });

    const { toggleTodo } = store.intents({
      toggleTodo: (draft, id: number) => {
        const todo = draft.todos.find(t => t.id === id);
        if (todo) {
          todo.done = !todo.done;
        }
      }
    });

    // Pre-register lens in the store cache
    store.lens("todos", s => s.todos);

    function TodoApp() {
      // Resolve lens dynamically via selector from Context
      const todos = useValue(s => s.lens("todos")) as any;
      return (
        <div>
          {todos.map((todo: any) => (
            <span key={todo.id} data-testid={`todo-${todo.id}`}>
              {todo.text} - {todo.done ? "Done" : "Pending"}
            </span>
          ))}
          <button data-testid="btn-toggle" onClick={() => toggleTodo(1)}>Toggle</button>
        </div>
      );
    }

    const { getByTestId } = render(
      <UtsutsuProvider store={store}>
        <TodoApp />
      </UtsutsuProvider>
    );

    expect(getByTestId("todo-1").textContent).toBe("Buy milk - Pending");

    fireEvent.click(getByTestId("btn-toggle"));
    expect(getByTestId("todo-1").textContent).toBe("Buy milk - Done");
  });
});

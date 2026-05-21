<p align="center">
  <img src="logo.png" alt="Utsutsu Logo" width="128" height="128" style="border-radius: 24px;" />
</p>

<h1 align="center">Utsutsu 🧝</h1>

<p align="center">
  <strong>Simple to read. Explicit to update. Precise to re-render.</strong>
</p>

Utsutsu is an ultra-lightweight, type-safe state management library designed specifically for React. It is engineered to give you the **precision of Signals** with the **predictability of unidirectional data flows**—without the boilerplate of Redux or the selector mess of Zustand.

---

## 🌊 The Philosophy of Utsutsu (現)

In classical Japanese, **Utsutsu (現)** refers to **reality, the waking world, and the state of being fully conscious**—as opposed to dreams, illusions, or shadows. 

Modern React state management often traps developers in a dream-like state of complex abstractions:
*   We write boilerplate (Reducers, Action Creators, Slices) to describe simple changes.
*   We write complex, brittle selectors (`state => state.todos.filter(...)`) hoping they won't cause unexpected re-render loops when they evaluate incorrectly.
*   We let states update in fragmented, erratic waves, losing track of transaction boundaries.

**Utsutsu** is designed to bring your application state back to the waking world:
1.  **State is Reality (Cells)**: No magic proxies or heavy wrappers. Just raw, atomic, predictable values that store the absolute truth.
2.  **Views are Direct Reflections (Lenses)**: Lenses are static, pure functions that cache their calculations. They subscribe and unsubscribe on-demand only when components wake up (active rendering) and rest when they sleep (unmounted).
3.  **Updates are Waking Actions (Intents)**: State doesn't shift implicitly. It shifts only when a named **Intent** is explicitly dispatched, representing a clear transaction in reality.

Utsutsu is state management stripped of dream-like illusions—designed to be direct, transparent, and awake.

---

## ✨ Why You'll Love Utsutsu

Most React state libraries force you to choose between two architectural evils:
1.  **Boilerplate Hell**: Dispatching actions through slices, reducers, and selectors just to update a username.
2.  **Selector Noise**: Writing inline filters directly inside components (`useStore(s => s.todos.filter(t => !t.done))`), causing accidental re-renders and making refactoring a nightmare.

Here is how Utsutsu changes the developer experience:

*   **Zero Selector Stress (Precise Re-renders)**:
    In other libraries, if you write an inline selector incorrectly, your component re-renders on *every* state change. In Utsutsu, components subscribe to **Handles** (which wrap Cells or Lenses). Identity is stable, and derived state recalculates on-demand.
*   **Named Intents (Strict Unidirectional Flow)**:
    Instead of letting components mutate state arbitrarily, Utsutsu updates state through **Intents**—explicit, named business operations. It’s like having Redux Actions and Reducers, but written in a single line of code.
*   **Invisible TypeScript Inference (100% Type-Safe)**:
    Utsutsu is fully type-safe. You never write manual type annotations at the hook call site or inside your actions. Utsutsu infers payloads, store shapes, and derived types automatically.

---

## ⚖️ Side-by-Side: Utsutsu vs. Zustand

### The Zustand Way 🐻
```ts
// store.ts
import { create } from "zustand";

interface TodoStore {
  todos: { id: number; text: string; done: boolean }[];
  addTodo: (text: string) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  addTodo: (text) => set((s) => ({
    todos: [...s.todos, { id: Date.now(), text, done: false }]
  })),
}));

// Component.tsx
function TodoCount() {
  // ⚠️ Rerenders whenever ANY todo changes unless you write strict selector functions!
  const todos = useTodoStore((s) => s.todos);
  const undoneCount = todos.filter(t => !t.done).length;
  return <span>Undone: {undoneCount}</span>;
}
```

### The Utsutsu Way 🧝
```ts
// store.ts
import { createUtsutsu } from "utsutsu";

export const store = createUtsutsu({
  todos: [] as { id: number; text: string; done: boolean }[]
});

// Lenses are computed derived state—defined ONCE outside React, with dynamic caching
export const undoneCountLens = store.lens("undoneCount", s => 
  s.todos.filter(t => !t.done).length
);

// Grouped intents with mutative draft writes
export const todoIntents = store.intents({
  addTodo: (draft, text: string) => {
    draft.todos.push({ id: Date.now(), text, done: false });
  }
});

// Component.tsx
import { useValue } from "utsutsu";

function TodoCount() {
  // ✅ Rerenders ONLY when the calculated count changes.
  const undoneCount = useValue(undoneCountLens);
  return <span>Undone: {undoneCount}</span>;
}
```

---

## 🧩 Core Concepts

### 1. Cells (Atomic State Units)
The smallest writable state unit in Utsutsu. You spawn Cells directly from the root store container via `store.cell("path")` to establish a clear lineage.

#### Spawning and Using Sub-Cells
```ts
const store = createUtsutsu({ count: 0 });

// A primitive cell explicitly tied to the root tree domain
const countCell = store.cell("count"); 

countCell.get();       // 0
countCell.set(1);       // Updates parent store state, notifying subscribers

// React Usage (Automatic Subscriptions)
function Counter() {
  // useValue reads the cell AND registers a React subscriber
  const count = useValue(countCell);
  
  return (
    <button onClick={() => countCell.set(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### 2. Lenses (Multi-Lens Graph Dependency Tracking)
A `Lens` represents derived read-only state. Lenses automatically track their dependencies during execution—not just from raw state, but also from *other Lenses*, building a Directed Acyclic Graph (DAG) under the hood.

> [!IMPORTANT]
> **Active/Passive Lifecycle Toggles**:
> Lenses subscribe to their dependencies *only* when a React component is actively subscribed to them. Otherwise, they enter a **Passive State** and unsubscribe from all dependencies to prevent memory leaks, evaluating on-demand only when read.

```ts
const todosLens = store.lens("todos", s => s.todos);

// Dependent Lens automatically tracks updates radiating through todosLens
const completedTodosLens = store.lens("completedTodos", () => {
  return todosLens.get().filter(t => t.done);
});
```

### 3. Intents (Grouped & Mutative Drafts)
Intents are named mutations. Utsutsu wraps state mutations in a copy-on-write Proxy draft. You write natural, mutative logic directly inside the handlers without deep object spreading.

```ts
const userIntents = store.intents({
  updateZipCode: (draft, zip: string) => {
    draft.user.address.zip = zip;
  }
});

// Invocation is natural, type-safe, and namespace grouped:
userIntents.updateZipCode("456");
```

### 4. Frames (Transactional Updates)
Want to batch multiple updates? Wrap them in a `frame`. Utsutsu queues notifications, triggering exactly **one** React re-render when the frame exits.

```ts
store.frame(() => {
  todoIntents.addTodo("Learn Utsutsu");
  todoIntents.addTodo("Build an app");
});
// ──> One render cycle, not two
```

---

## 🧩 Advanced: Modular Slices

Large applications need code-splitting. Utsutsu allows you to mount dynamic sub-stores at runtime:

```ts
// Lazy-loaded bundle
export const dashboardSlice = store.mount("dashboard", {
  activeTab: "overview",
  metrics: []
});

export const activeTabLens = dashboardSlice.lens("activeTab", s => s.activeTab);
export const dashboardIntents = dashboardSlice.intents({
  switchTab: (draft, tab: string) => {
    draft.activeTab = tab;
  }
});

// Clean up memory when feature is unmounted
// store.unmount("dashboard");
```

### Redux DevTools (Time-Travel Debugging)
Utsutsu provides a dedicated, lightweight devtools extension adapter. This allows you to inspect Intent execution logs, trace payload parameters, and run time-travel debugging inside the Redux DevTools extension:

```ts
import { connectDevTools } from "utsutsu";
import { store } from "./store";

// Connect to browser extension
const disconnect = connectDevTools(store, { name: "My App Store" });

// To clean up subscriptions later (e.g. in hot module replacement)
// disconnect();
```

---

## 🌐 Server-Side Rendering (SSR) & Framework Isolation

Global singleton stores leak state across concurrent user requests in Server-Side Rendering (SSR) environments. To prevent state leaks, wrap your app in `UtsutsuProvider` and pass the store created per-request/session via `useState`.

```tsx
// App.tsx
import { useState } from "react";
import { createUtsutsu, UtsutsuProvider } from "utsutsu";

export default function App({ children }) {
  // Created once per server request/session
  const [store] = useState(() => createUtsutsu({ todos: [] })); 

  return (
    <UtsutsuProvider store={store}>
      {children}
    </UtsutsuProvider>
  );
}
```

Inside your child components, use `useValue` with a selector function. This automatically resolves the store instance bound to the current server request context:

```tsx
// Component.tsx
import { useValue } from "utsutsu";

export function TodoList() {
  // Automatically resolves from the nearest UtsutsuProvider
  const todos = useValue(s => s.lens("todos", state => state.todos));

  return (
    <ul>
      {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

---

## 🔄 Asynchronous Workflows (Network Side Effects)

Intents in Utsutsu are purely synchronous, deterministic transaction boundaries to ensure features like Time-Travel Debugging work cleanly. 

To handle asynchronous workflows (e.g. data fetching), perform the async operations inside a standard JavaScript function and call synchronous intents to update status and apply data.

```ts
// 1. Declare pure synchronous intents
export const statusIntents = store.intents({
  fetchStart: (draft) => { draft.loading = true; },
  fetchSuccess: (draft, data) => { draft.loading = false; draft.data = data; }
});

// 2. Define an asynchronous wrapper function
export const loadData = async (id: string) => {
  statusIntents.fetchStart();
  try {
    const res = await fetch(`/api/items/${id}`);
    statusIntents.fetchSuccess(await res.json());
  } catch (error) {
    // handle errors with another intent
  }
};
```

---

## ⚖️ The Ecosystem Comparison Matrix

| Dimension | Redux Toolkit | Zustand | Jotai | **Utsutsu** |
| :--- | :--- | :--- | :--- | :--- |
| **Boilerplate** | High | Low | Medium | **Very Low** |
| **State Shape** | Single Tree | Single Tree | Distributed Atoms | **Single Tree + Slices** |
| **Update Path** | Dispatch Actions | Direct Mutators | Atom Setters | **Explicit Intents** |
| **Rerender Control** | Manual Selectors | Selector Hook | Atom Subscriptions | **Automatic Lens Graph** |
| **Batching** | Middleware | Auto-batched | Auto-batched | **Transaction Frames** |

---

## 🛡️ Production & Safety Guarantees

Utsutsu is built from the ground up for high-performance production workloads:
*   **React Server Components (RSC) Ready**: Fully compatible with React 18 & 19 architectures. Includes the `"use client";` boundary directive on all React bindings.
*   **Dead-Code Elimination (Tree-Shaking)**: Configured with `"sideEffects": false` to ensure bundlers (like Vite, Webpack, or Rollup) drop unused primitives.
*   **Strict Slice Safety**: Dynamically mounted models throw explicit runtime errors upon mounting duplicate keys, preventing state corruptions.
*   **Evaluation Isolation**: Derived state computation is sandboxed inside `try...finally` blocks. If a user selector throws an error, Utsutsu recovers the global evaluation context immediately without leaking registry references.

---

## 🔧 Installation & Tooling

```bash
# Install
npm install utsutsu

# Run tests
npm run test

# Compile ESM & CommonJS bundles
npm run build
```

---

*Utsutsu · Handle-first reactive state for React · MIT License*

import { Cell, createCell } from "./cell.js";
import { Lens } from "./lens.js";
import { frame } from "./frame.js";

/**
 * UtsutsuStore is the orchestrator for state, lenses, and intents.
 */
export class UtsutsuStore<State> {
  // Expose rootCell internally for synchronizing sub-stores
  public rootCell: Cell<State>;
  public lastIntent: { name: string; args: any[] } | null = null;
  private childStores = new Map<string, UtsutsuStore<any>>();
  private lenses = new Map<string, Lens<any>>();
  private isSyncing = false;

  constructor(initialState: State) {
    this.rootCell = createCell(initialState);
  }

  /**
   * Returns the current full state of the store.
   */
  get(): State {
    return this.rootCell.get();
  }

  /**
   * Creates or returns a cached, derived Lens.
   */
  lens<Name extends string, R>(
    name: Name,
    computeFn?: (state: State) => R
  ): Lens<R> {
    if (this.lenses.has(name)) {
      return this.lenses.get(name) as Lens<R>;
    }
    if (!computeFn) {
      throw new Error(`Lens "${name}" is not registered yet.`);
    }
    const newLens = new Lens(name, () => computeFn(this.rootCell.get()));
    this.lenses.set(name, newLens);
    return newLens;
  }

  /**
   * Creates a group of named write operations (Intents) with mutative draft writes.
   */
  intents<
    Handlers extends { [key: string]: (draft: State, ...args: any[]) => void }
  >(
    handlers: Handlers
  ): {
    [K in keyof Handlers]: Handlers[K] extends (draft: State, ...args: infer Args) => void
      ? (...args: Args) => void
      : never;
  } {
    const boundIntents = {} as any;

    for (const [name, handlerFn] of Object.entries(handlers)) {
      const intentFn = (...args: any[]) => {
        this.lastIntent = { name, args };
        frame(() => {
          const currentState = this.rootCell.get();
          const draft = createDraft(currentState);
          handlerFn(draft, ...args);
          const nextState = draft.__finalize__();
          this.rootCell.set(nextState);
        });
      };

      Object.defineProperty(intentFn, "name", { value: name, configurable: true });
      boundIntents[name] = intentFn;
    }

    return boundIntents;
  }

  /**
   * Spawns a primitive Cell explicitly tied to a state key in this store,
   * with bi-directional synchronization.
   */
  cell<K extends keyof State>(key: K): Cell<State[K]> {
    const initialVal = this.rootCell.get()[key];
    const subCell = new Cell(initialVal);
    let isSyncing = false;

    // Sync parent store changes to sub-cell
    this.rootCell.subscribe(() => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const nextVal = this.rootCell.get()[key];
        if (subCell.get() !== nextVal) {
          subCell.set(nextVal);
        }
      } finally {
        isSyncing = false;
      }
    });

    // Sync sub-cell changes back to parent store
    subCell.subscribe(() => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const nextVal = subCell.get();
        const parentState = this.rootCell.get();
        if (parentState[key] !== nextVal) {
          this.rootCell.set({
            ...parentState,
            [key]: nextVal
          });
        }
      } finally {
        isSyncing = false;
      }
    });

    return subCell;
  }


  /**
   * Batch multiple writes in a single update boundary.
   */
  frame(fn: () => void): void {
    frame(fn);
  }

  /**
   * Dynamically mounts a sub-state slice onto this store.
   * Enables modular development and code-splitting while maintaining a single state tree.
   */
  mount<Key extends string, SubState>(
    key: Key,
    initialSubState: SubState
  ): UtsutsuStore<SubState> {
    const currentState = this.rootCell.get();

    if (key in (currentState as any)) {
      throw new Error(`State key "${key}" is already registered in store.`);
    }

    // Set the initial state on the parent root
    this.rootCell.set({
      ...currentState,
      [key]: initialSubState
    } as any);

    const subStore = new UtsutsuStore<SubState>(initialSubState);

    // Sync child changes upstream to parent root
    subStore.rootCell.subscribe(() => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        const parentState = this.rootCell.get();
        const childState = subStore.rootCell.get();
        if ((parentState as any)[key] !== childState) {
          this.rootCell.set({
            ...parentState,
            [key]: childState
          } as any);
        }
      } finally {
        this.isSyncing = false;
      }
    });

    // Sync parent root changes downstream to child
    this.rootCell.subscribe(() => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        const parentState = this.rootCell.get();
        const childState = (parentState as any)[key];
        if (childState !== undefined && childState !== subStore.rootCell.get()) {
          subStore.rootCell.set(childState);
        }
      } finally {
        this.isSyncing = false;
      }
    });

    this.childStores.set(key, subStore);
    return subStore;
  }

  /**
   * Unmounts a sub-state slice, cleaning up state and listeners.
   */
  unmount(key: string): void {
    const subStore = this.childStores.get(key);
    if (subStore) {
      this.childStores.delete(key);
      const currentState = { ...this.rootCell.get() as any };
      delete currentState[key];
      this.rootCell.set(currentState);
    }
  }
}

/**
 * Creates a new Utsutsu store instance.
 */
export function createUtsutsu<State>(initialState: State): UtsutsuStore<State> {
  return new UtsutsuStore(initialState);
}

/**
 * Creates a copy-on-write proxy draft for mutating state.
 */
function createDraft(base: any, parent?: { copyParent: () => void; key: any }): any {
  if (base === null || typeof base !== "object") {
    return base;
  }

  let copy: any = null;
  const proxyMap = new Map<any, any>();

  const ensureCopy = () => {
    if (!copy) {
      copy = Array.isArray(base) ? [...base] : { ...base };
      if (parent) {
        parent.copyParent();
      }
    }
  };

  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      if (prop === "__isDraft__") return true;
      if (prop === "__copy__") return copy;
      if (prop === "__finalize__") {
        return () => {
          if (!copy) return base;
          for (const key of Reflect.ownKeys(copy)) {
            const val = copy[key];
            if (val && val.__isDraft__) {
              copy[key] = val.__finalize__();
            }
          }
          return copy;
        };
      }

      const activeTarget = copy || target;
      const value = Reflect.get(activeTarget, prop, receiver);

      if (value !== null && typeof value === "object") {
        if (proxyMap.has(prop)) {
          return proxyMap.get(prop);
        }
        const childProxy = createDraft(value, {
          copyParent: () => {
            ensureCopy();
            copy[prop] = childProxy;
          },
          key: prop,
        });
        proxyMap.set(prop, childProxy);
        return childProxy;
      }
      return value;
    },
    set(_target, prop, value, _receiver) {
      ensureCopy();
      const valToSet = (value && value.__isDraft__) ? (value.__copy__ || value) : value;
      copy[prop] = valToSet;
      if (parent) {
        parent.copyParent();
      }
      return true;
    },
    deleteProperty(_target, prop) {
      ensureCopy();
      const success = Reflect.deleteProperty(copy, prop);
      if (parent) {
        parent.copyParent();
      }
      return success;
    },
    has(target, prop) {
      return Reflect.has(copy || target, prop);
    },
    ownKeys(target) {
      return Reflect.ownKeys(copy || target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(copy || target, prop);
    }
  };

  return new Proxy(base, handler);
}

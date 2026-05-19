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
   * Creates a derived, cached Lens.
   */
  lens<Name extends string, R>(
    name: Name,
    computeFn: (state: State) => R
  ): Lens<R> {
    return new Lens(name, () => computeFn(this.rootCell.get()));
  }

  /**
   * Creates a named write operation (Intent).
   */
  intent<Name extends string, Args extends any[]>(
    name: Name,
    handlerFn: (state: State, ...args: Args) => State
  ): (...args: Args) => void {
    const intentFn = (...args: Args) => {
      this.lastIntent = { name, args };
      frame(() => {
        const currentState = this.rootCell.get();
        const nextState = handlerFn(currentState, ...args);
        this.rootCell.set(nextState);
      });
    };
    
    // Set the function name property for debug inspection and devtools
    Object.defineProperty(intentFn, "name", { value: name, configurable: true });
    
    return intentFn;
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

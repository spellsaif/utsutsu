import { Dep, pushActiveLens, popActiveLens, reportRead } from "./dependencyTracker.js";
import { notifyOrQueue } from "./batch.js";

/**
 * A Lens is a cached, derived read-only state unit.
 * It dynamically tracks its dependencies (Cells or other Lenses) and recomputes
 * only when those dependencies change.
 */
export class Lens<T> implements Dep {
  public name: string;
  private computeFn: () => T;
  
  // Cache state
  private cachedValue: T | null = null;
  private hasCachedValue = false;
  private version = 0;

  // Dependency graph
  private dependencies = new Map<Dep, { version: number; unsubscribe: (() => void) | null }>();
  private activeEvaluationDeps = new Set<Dep>();

  // Subscribers to this Lens
  private subscribers = new Set<() => void>();

  constructor(name: string, computeFn: () => T) {
    this.name = name;
    this.computeFn = computeFn;
    
    // Bind methods to prevent 'this' context loss
    this.get = this.get.bind(this);
    this.getVersion = this.getVersion.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  /**
   * Reads the current derived value.
   * Leverages caching and dynamic dependency registration.
   */
  get(): T {
    reportRead(this);

    if (this.isDirty()) {
      this.evaluate();
    }

    return this.cachedValue as T;
  }

  /**
   * Returns the current version of this Lens.
   * Incremented when the computed value actually changes.
   */
  getVersion(): number {
    if (this.isDirty()) {
      this.evaluate();
    }
    return this.version;
  }

  /**
   * Registers a dependency that was read during this Lens's computation.
   */
  registerDependency(dep: Dep): void {
    this.activeEvaluationDeps.add(dep);
  }

  /**
   * Subscribes a listener to receive notifications when this Lens's derived value changes.
   * Toggles the Lens into "Active" mode, subscribing to its dependencies.
   */
  subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);

    // If transitioning from Passive -> Active:
    if (this.subscribers.size === 1) {
      if (this.isDirty()) {
        // Force evaluation to discover dependencies and establish subscriptions
        this.evaluate();
      } else {
        this.activate();
      }
    }

    return () => {
      this.subscribers.delete(listener);
      // If transitioning from Active -> Passive:
      // Unsubscribe from all dependencies to save memory and avoid leaks.
      if (this.subscribers.size === 0) {
        this.deactivate();
      }
    };
  }


  /**
   * Checks if any dependency version has changed, or if there is no cached value yet.
   */
  private isDirty(): boolean {
    if (!this.hasCachedValue) {
      return true;
    }

    for (const [dep, meta] of this.dependencies.entries()) {
      if (dep.getVersion() !== meta.version) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluates the compute function and updates dependencies and cached value.
   */
  private evaluate(): void {
    const oldDeps = new Map(this.dependencies);
    this.activeEvaluationDeps.clear();

    pushActiveLens(this);
    let newValue: T;
    try {
      newValue = this.computeFn();
    } finally {
      popActiveLens();
    }

    // Process new dependencies gathered during evaluation
    const newDeps = new Map<Dep, { version: number; unsubscribe: (() => void) | null }>();
    const isActivelySubscribed = this.subscribers.size > 0;

    for (const dep of this.activeEvaluationDeps) {
      const oldMeta = oldDeps.get(dep);
      let unsubscribe = oldMeta?.unsubscribe || null;

      // If active, and this is a newly discovered dependency, subscribe to it
      if (isActivelySubscribed && !oldMeta) {
        unsubscribe = dep.subscribe(() => this.onDependencyChange());
      }

      newDeps.set(dep, {
        version: dep.getVersion(),
        unsubscribe
      });

      // Remove from oldDeps so we know what's left is obsolete
      oldDeps.delete(dep);
    }

    // Unsubscribe from obsolete dependencies that were not read in this evaluation run
    for (const [, meta] of oldDeps.entries()) {
      if (meta.unsubscribe) {
        meta.unsubscribe();
      }
    }

    this.dependencies = newDeps;

    // Check if value changed to update the version
    if (!this.hasCachedValue || !Object.is(this.cachedValue, newValue)) {
      this.cachedValue = newValue;
      this.version++;
    }
    this.hasCachedValue = true;
  }

  /**
   * Callback invoked when any dependency of this Lens updates.
   * If the recomputed value changes, notifies subscribers.
   */
  private onDependencyChange(): void {
    // Only recompute and notify if we are actually dirty
    if (this.isDirty()) {
      const oldVal = this.cachedValue;
      this.evaluate();

      // If the new value is different, notify our subscribers
      if (!Object.is(oldVal, this.cachedValue)) {
        this.notify();
      }
    }
  }

  /**
   * Registers subscriptions to all dependencies when the Lens becomes Active.
   */
  private activate(): void {
    for (const [dep, meta] of this.dependencies.entries()) {
      if (!meta.unsubscribe) {
        meta.unsubscribe = dep.subscribe(() => this.onDependencyChange());
        // Update version to current to prevent stale checks
        meta.version = dep.getVersion();
      }
    }
  }

  /**
   * Unsubscribes from all dependencies when the Lens becomes Passive.
   */
  private deactivate(): void {
    for (const [, meta] of this.dependencies.entries()) {
      if (meta.unsubscribe) {
        meta.unsubscribe();
        meta.unsubscribe = null;
      }
    }
    // We also clear cache flag to force fresh evaluation when read passively
    this.hasCachedValue = false;
    this.cachedValue = null;
  }

  /**
   * Notifies all subscribers of this Lens (batched or immediate).
   */
  private notify(): void {
    for (const listener of this.subscribers) {
      notifyOrQueue(listener);
    }
  }
}

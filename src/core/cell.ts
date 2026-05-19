import { reportRead } from "./dependencyTracker.js";
import { notifyOrQueue } from "./batch.js";

/**
 * A Cell is the smallest reactive unit in Utsutsu.
 * It holds a value, tracks its version number, and notifies subscribers on update.
 */
export class Cell<T> {
  private value: T;
  private version = 0;
  private subscribers = new Set<() => void>();

  constructor(initialValue: T) {
    this.value = initialValue;
    this.get = this.get.bind(this);
    this.getVersion = this.getVersion.bind(this);
    this.set = this.set.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }


  /**
   * Reads the current cell value.
   * Dynamically registers this cell as a dependency of whatever lens is currently evaluating.
   */
  get(): T {
    reportRead(this);
    return this.value;
  }


  /**
   * Returns the current version of the cell.
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Sets a new value for the cell.
   * If the value changed, increments the version and triggers subscribers (batched or immediate).
   */
  set(newValue: T): void {
    if (!Object.is(this.value, newValue)) {
      this.value = newValue;
      this.version++;
      this.notify();
    }
  }

  /**
   * Registers a subscriber callback to be notified when the cell value changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * Notifies all subscribers, queueing them if inside a batch boundary.
   */
  private notify(): void {
    for (const listener of this.subscribers) {
      notifyOrQueue(listener);
    }
  }
}

/**
 * Helper to create a new cell.
 */
export function createCell<T>(initialValue: T): Cell<T> {
  return new Cell(initialValue);
}

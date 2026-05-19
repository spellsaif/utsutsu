// Global batching state
let batchDepth = 0;
const pendingNotifications = new Set<() => void>();

/**
 * Returns whether we are currently inside a batch boundary (Frame).
 */
export function isBatching(): boolean {
  return batchDepth > 0;
}

/**
 * Enters a batch boundary.
 */
export function enterBatch(): void {
  batchDepth++;
}

/**
 * Exits a batch boundary. If depth reaches 0, all pending notifications are flushed.
 */
export function exitBatch(): void {
  batchDepth--;
  if (batchDepth === 0) {
    flushBatch();
  }
}

/**
 * Registers a notification listener to be executed.
 * If batching, it is deferred. Otherwise, it executes immediately.
 */
export function notifyOrQueue(listener: () => void): void {
  if (isBatching()) {
    pendingNotifications.add(listener);
  } else {
    listener();
  }
}

/**
 * Flushes all deferred notifications.
 */
function flushBatch(): void {
  const listeners = Array.from(pendingNotifications);
  pendingNotifications.clear();
  
  // Execute all unique listeners once
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.error("Error during batch notification flush:", e);
    }
  }
}

/**
 * Executes a function inside a batch boundary.
 */
export function batch(fn: () => void): void {
  enterBatch();
  try {
    fn();
  } finally {
    exitBatch();
  }
}

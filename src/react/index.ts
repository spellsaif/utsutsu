"use client";

import { useSyncExternalStore, useState, useEffect, useTransition } from "react";

/**
 * Handle is the public interface representing read-only access
 * to a Cell or a Lens that components can subscribe to.
 */
export interface Handle<T> {
  get(): T;
  subscribe(listener: () => void): () => void;
}

/**
 * Standard React hook to subscribe to any Utsutsu Handle (Cell or Lens).
 * Leverages React's useSyncExternalStore for tear-free, synchronous updates.
 */
export function useValue<T>(handle: Handle<T>): T {
  return useSyncExternalStore(
    handle.subscribe,
    handle.get,
    handle.get // Server snapshot matches client snapshot for SSR
  );
}

/**
 * Transition-safe React hook to subscribe to any Utsutsu Handle.
 * Runs state updates inside a React transition, preventing heavy derived Lens computations
 * from blocking the main UI thread during concurrent rendering.
 */
export function useValueDeferred<T>(handle: Handle<T>): T {
  const [value, setValue] = useState(() => handle.get());
  const [, startReactTransition] = useTransition();

  useEffect(() => {
    return handle.subscribe(() => {
      // Defer the state synchronization inside a React transition.
      // This informs React that rendering this updated value is low-priority
      // and can be deferred or split across frames.
      startReactTransition(() => {
        setValue(handle.get());
      });
    });
  }, [handle]);

  return value;
}

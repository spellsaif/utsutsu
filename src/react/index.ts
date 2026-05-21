"use client";

import React, { useSyncExternalStore, useState, useEffect, useTransition, createContext, useContext } from "react";
import type { UtsutsuStore } from "../core/store.js";

/**
 * Handle is the public interface representing read-only access
 * to a Cell or a Lens that components can subscribe to.
 */
export interface Handle<T> {
  get(): T;
  subscribe(listener: () => void): () => void;
}

export const UtsutsuContext = createContext<UtsutsuStore<any> | null>(null);

export function UtsutsuProvider({
  store,
  children
}: {
  store: UtsutsuStore<any>;
  children: React.ReactNode;
}) {
  return React.createElement(UtsutsuContext.Provider, { value: store }, children);
}

export function useUtsutsuStore<State = any>(): UtsutsuStore<State> {
  const store = useContext(UtsutsuContext);
  if (!store) {
    throw new Error("useUtsutsuStore must be used within a UtsutsuProvider");
  }
  return store;
}

/**
 * Standard React hook to subscribe to any Utsutsu Handle (Cell or Lens) or a selector function.
 * Leverages React's useSyncExternalStore for tear-free, synchronous updates.
 */
export function useValue<T>(
  handleOrSelector: Handle<T> | ((store: UtsutsuStore<any>) => Handle<T>)
): T {
  const store = useContext(UtsutsuContext);
  const handle = typeof handleOrSelector === "function"
    ? (handleOrSelector as any)(store)
    : handleOrSelector;

  if (!handle) {
    throw new Error("Handle not found or UtsutsuProvider is missing");
  }

  return useSyncExternalStore(
    handle.subscribe,
    handle.get,
    handle.get // Server snapshot matches client snapshot for SSR
  );
}

/**
 * Transition-safe React hook to subscribe to any Utsutsu Handle or selector function.
 * Runs state updates inside a React transition, preventing heavy derived Lens computations
 * from blocking the main UI thread during concurrent rendering.
 */
export function useValueDeferred<T>(
  handleOrSelector: Handle<T> | ((store: UtsutsuStore<any>) => Handle<T>)
): T {
  const store = useContext(UtsutsuContext);
  const handle = typeof handleOrSelector === "function"
    ? (handleOrSelector as any)(store)
    : handleOrSelector;

  if (!handle) {
    throw new Error("Handle not found or UtsutsuProvider is missing");
  }

  const [value, setValue] = useState(() => handle.get());
  const [, startReactTransition] = useTransition();

  useEffect(() => {
    return handle.subscribe(() => {
      // Defer the state synchronization inside a React transition.
      startReactTransition(() => {
        setValue(handle.get());
      });
    });
  }, [handle]);

  return value;
}

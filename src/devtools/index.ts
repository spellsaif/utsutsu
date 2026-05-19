import type { UtsutsuStore } from "../core/store.js";

/**
 * Options for configuring the Redux DevTools connection.
 */
export interface DevToolsOptions {
  name?: string;
  maxAge?: number;
  latency?: number;
  trace?: boolean;
}

/**
 * Connects a Utsutsu store to the Redux DevTools extension.
 * Supports action logging and time-travel debugging.
 */
export function connectDevTools<State>(
  store: UtsutsuStore<State>,
  options: DevToolsOptions = {}
): () => void {
  // Gracefully handle Server-Side Rendering (SSR) environments
  if (typeof window === "undefined" || !(window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    return () => {};
  }

  const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  const devtools = extension.connect({
    name: options.name || "Utsutsu Store",
    ...options
  });

  let isJumping = false;

  // Initialize Redux DevTools with current store value
  devtools.init(store.get());

  // Subscribe to store updates to report intent dispatches
  const unsubscribeStore = store.rootCell.subscribe(() => {
    if (isJumping) return;

    const lastIntent = store.lastIntent;
    const action = lastIntent
      ? { type: lastIntent.name, payload: lastIntent.args }
      : { type: "@@STATE_UPDATE" };

    devtools.send(action, store.get());
  });

  // Subscribe to Redux DevTools messages (Time-Travel Debugging)
  const unsubscribeDevTools = devtools.subscribe((message: any) => {
    if (message.type === "DISPATCH") {
      const type = message.payload.type;

      if (type === "JUMP_TO_ACTION" || type === "JUMP_TO_STATE") {
        isJumping = true;
        try {
          const state = JSON.parse(message.state);
          store.rootCell.set(state);
        } catch (e) {
          console.error("[Utsutsu DevTools] Failed parsing state for time-travel", e);
        } finally {
          isJumping = false;
        }
      }
    }
  });

  // Return a cleanup function to disconnect devtools and stop listening
  return () => {
    unsubscribeStore();
    unsubscribeDevTools();
  };
}

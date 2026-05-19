import type { Lens } from "./lens.js";

export interface Dep {
  subscribe(listener: () => void): () => void;
  getVersion(): number;
}

// The global evaluation stack to track which lens is currently computing.
// This allows us to implicitly capture dependencies when cell.get() or lens.get() is called.
const evaluationStack: Lens<any>[] = [];

/**
 * Pushes a lens onto the evaluation stack.
 */
export function pushActiveLens(lens: Lens<any>): void {
  evaluationStack.push(lens);
}

/**
 * Pops the top lens off the evaluation stack.
 */
export function popActiveLens(): void {
  evaluationStack.pop();
}

/**
 * Returns the currently active lens that is executing, or null if none.
 */
export function getActiveLens(): Lens<any> | null {
  return evaluationStack[evaluationStack.length - 1] || null;
}

/**
 * Called by cell.get() or lens.get() to report that it has been read.
 * If a lens is currently evaluating, it will add the dependency.
 */
export function reportRead(dep: Dep): void {
  const activeLens = getActiveLens();
  if (activeLens && activeLens !== dep) {
    activeLens.registerDependency(dep);
  }
}


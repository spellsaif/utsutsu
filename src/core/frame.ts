import { batch } from "./batch.js";

/**
 * Executes a block of code within a frame.
 * All cell writes inside the frame will be batched, resulting in a single notification wave.
 */
export function frame(fn: () => void): void {
  batch(fn);
}

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-05-22

### Fixed
- **React StrictMode compatibility**: Resolved a bug where `Lens` instances would lose reactivity after a React StrictMode-triggered remount (Active → Passive → Active lifecycle). During `deactivate()`, dependency subscriptions were correctly cleaned up, but the dependency metadata was still retained in the map. On the subsequent `evaluate()` call triggered by re-activation, the subscription check `!oldMeta` incorrectly evaluated to `false` (because the dep key still existed), causing the lens to silently skip re-subscribing to its dependencies. Changed the guard to `!unsubscribe`, which correctly detects a missing active subscription regardless of whether the dependency was previously tracked.

---

## [0.2.0] - 2026-05-22


### Added
- **React Context Provider (`UtsutsuProvider`)**: Added `UtsutsuProvider` and `useUtsutsuStore` to bind store instances safely to the React component lifecycle. This isolates store instances per request/session, avoiding state leakage in Server-Side Rendering (SSR) environments like Next.js or Remix.
- **Grouped Intents (`store.intents`)**: Introduced a grouped update registration API (`store.intents`) that accepts a key-value object of handlers. Keys are automatically mapped as transaction names for Redux DevTools integration.
- **Proxy Mutator Drafts (`createDraft`)**: Implemented a lightweight, copy-on-write Proxy-based draft mutator engine. Handler functions receive a mutable draft proxy rather than needing verbose object spread syntax (`...state`), preventing boilerplate and accidental shallow reference sharing.
- **Unified Cell Lineage Spawning (`store.cell`)**: Added `store.cell(key)` to spawn standalone sub-cells bound to a specific parent key in the root store. Includes complete bi-directional synchronization between parent store mutations and child cell updates.
- **Multi-Lens DAG Dependency Tracking**: Verified and reinforced nested derived Lens-to-Lens tracking, building a complete Directed Acyclic Graph (DAG) under the hood. Unmounting components dynamically transitions inactive lenses to a sleeping state, suspending useless computations.
- **Asynchronous Workflow Documentation**: Added architectural guidance and patterns to `README.md` on structuring side-effects/async logic around synchronous pure intents.

### Changed
- **Deprecated `store.intent`**: The `store.intent(name, mutator)` API is deprecated and replaced by the new grouped `store.intents({ key: handler })` API to streamline transaction declarations and improve type safety.
- **Selector support in React Hooks**: `useValue` and `useValueDeferred` now support selector functions `(store) => Lens` to dynamically resolve from context under SSR setups, alongside direct lens resolution.

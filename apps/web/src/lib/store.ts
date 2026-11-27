import { useSyncExternalStore } from 'react';

export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const store = {
    get: () => state,
    set(patch: Partial<T>) {
      let changed = false;
      for (const k of Object.keys(patch) as (keyof T)[]) {
        if (!Object.is(state[k], patch[k])) changed = true;
      }
      if (!changed) return;
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  return store;
}

export function useStore<T extends object, S>(
  store: ReturnType<typeof createStore<T>>,
  select: (s: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get()),
  );
}

export const landing = createStore({
  active: false,
  attached: true,
  islandW: 240,
});

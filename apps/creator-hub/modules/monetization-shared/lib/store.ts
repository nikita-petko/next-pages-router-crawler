export type Store<T extends object> = {
  getSnapshot: () => T;
  setState: (newState: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
};

/** Simple store implementation for `useSyncExternalStore` - using simple closure to expose the state */
export const createStore = <T extends object>(initialState: T): Store<T> => {
  const listeners = new Set<(state: T, prevState: T) => void>();
  let state = initialState;

  function setState(newState: Partial<T>) {
    const prevState = state;
    state = { ...state, ...newState };
    listeners.forEach((listener) => listener(state, prevState));
  }

  function getSnapshot() {
    return state;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  return {
    getSnapshot,
    setState,
    subscribe,
  };
};

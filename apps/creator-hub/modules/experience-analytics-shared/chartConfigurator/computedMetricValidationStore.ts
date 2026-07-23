import { useSyncExternalStore } from 'react';

type Store<T extends object> = {
  getSnapshot: () => T;
  setState: (newState: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
};

const createStore = <T extends object>(initialState: T): Store<T> => {
  const listeners = new Set<() => void>();
  let state = initialState;

  return {
    getSnapshot: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

type ComputedMetricValidationState = {
  hasError: boolean;
  // User-entered text (the name they typed for the formula). Not a translation
  // key, so this is `string | undefined` rather than `FormattedText | ...`.
  formulaLabel: string | undefined;
};

const store = createStore<ComputedMetricValidationState>({
  hasError: false,
  formulaLabel: undefined,
});

const getHasError = () => store.getSnapshot().hasError;
const getFormulaLabel = () => store.getSnapshot().formulaLabel;

export const setComputedMetricValidationError = (hasError: boolean): void => {
  if (store.getSnapshot().hasError !== hasError) {
    store.setState({ hasError });
  }
};

export const setComputedMetricFormulaLabel = (formulaLabel: string | undefined): void => {
  if (store.getSnapshot().formulaLabel !== formulaLabel) {
    store.setState({ formulaLabel });
  }
};

export const useComputedMetricValidationError = (): boolean =>
  useSyncExternalStore(store.subscribe, getHasError);

export const useComputedMetricFormulaLabel = (): string | undefined =>
  useSyncExternalStore(store.subscribe, getFormulaLabel);

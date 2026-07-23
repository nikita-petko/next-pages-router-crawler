import { createContext, useContext, useMemo, useRef } from 'react';
import type { PropsWithChildren } from 'react';

type PersistedSelections = string[][];

type ScopedPersistedSelections = {
  scopeKey: string;
  selections: PersistedSelections;
};

type RAQIV2ControlledSubcontextSelectionStore = {
  get: (key: string, scopeKey: string) => PersistedSelections | undefined;
  set: (key: string, scopeKey: string, selections: PersistedSelections) => void;
};

const RAQIV2ControlledSubcontextSelectionContext =
  createContext<RAQIV2ControlledSubcontextSelectionStore | null>(null);

export const RAQIV2ControlledSubcontextSelectionProvider = ({ children }: PropsWithChildren) => {
  const selectionsRef = useRef(new Map<string, ScopedPersistedSelections>());
  const store = useMemo<RAQIV2ControlledSubcontextSelectionStore>(
    () => ({
      get: (key, scopeKey) => {
        const persistedSelections = selectionsRef.current.get(key);
        return persistedSelections && persistedSelections.scopeKey === scopeKey
          ? persistedSelections.selections
          : undefined;
      },
      set: (key, scopeKey, selections) => {
        selectionsRef.current.set(key, { scopeKey, selections });
      },
    }),
    [],
  );

  return (
    <RAQIV2ControlledSubcontextSelectionContext.Provider value={store}>
      {children}
    </RAQIV2ControlledSubcontextSelectionContext.Provider>
  );
};

const useRAQIV2ControlledSubcontextSelectionStore = () =>
  useContext(RAQIV2ControlledSubcontextSelectionContext);

export default useRAQIV2ControlledSubcontextSelectionStore;

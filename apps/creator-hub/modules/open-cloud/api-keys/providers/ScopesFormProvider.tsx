import { useRef, useCallback, createContext, useMemo } from 'react';
import type TargetPartApiData from '../interfaces/TargetPartApiData';
import ScopeSystemFormStateManager from './ScopeSystemFormStateManager';

export interface ScopeFormContextValue {
  getScopeFormState?: () => ScopeSystemFormStateManager;
  targetCache: Record<string, TargetPartApiData>;
}

export const ScopesFormContext = createContext<ScopeFormContextValue>({
  getScopeFormState: undefined,
  targetCache: {},
});

ScopesFormContext.displayName = 'ScopesForm';

const ScopesFormProvider = ({ children }: React.PropsWithChildren) => {
  const scopeFormState = useRef<ScopeSystemFormStateManager | null>(null);
  const targetCache = useRef<Record<string, TargetPartApiData>>({});

  const getScopeFormState = useCallback((): ScopeSystemFormStateManager => {
    if (scopeFormState.current === null) {
      scopeFormState.current = new ScopeSystemFormStateManager();
    }
    return scopeFormState.current;
  }, []);

  return (
    <ScopesFormContext.Provider
      value={useMemo(
        () => ({ getScopeFormState, targetCache: targetCache.current }),
        [getScopeFormState],
      )}>
      {children}
    </ScopesFormContext.Provider>
  );
};

export default ScopesFormProvider;

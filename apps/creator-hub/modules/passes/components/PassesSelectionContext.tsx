import { createContext, useContext } from 'react';
import type { UseSelectEligiblePassesReturn } from '../hooks/useSelectEligiblePasses';

type PassesSelectionContextType = UseSelectEligiblePassesReturn;

const PassesSelectionContext = createContext<PassesSelectionContextType | null>(null);

export function usePassesSelectionContext() {
  const context = useContext(PassesSelectionContext);
  if (!context) {
    throw new Error('usePassesSelectionContext must be used within a PassesSelectionProvider');
  }
  return context;
}

export function PassesSelectionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: PassesSelectionContextType }>) {
  return (
    <PassesSelectionContext.Provider value={value}>{children}</PassesSelectionContext.Provider>
  );
}

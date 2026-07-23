import { createContext, useContext } from 'react';
import type { UseSelectEligibleDeveloperProductsReturn } from '../hooks/useSelectEligibleDeveloperProducts';

// Simple context to propagate selection state / actions for dev products table checkboxes
// using useSelectEligibleDeveloperProducts.

type DeveloperProductSelectionContextType = UseSelectEligibleDeveloperProductsReturn;

const DeveloperProductsSelectionContext =
  createContext<DeveloperProductSelectionContextType | null>(null);

export function useDeveloperProductSelectionContext() {
  const context = useContext(DeveloperProductsSelectionContext);
  if (!context) {
    throw new Error(
      'useDeveloperProductSelectionContext must be used within a DeveloperProductsSelectionProvider',
    );
  }
  return context;
}

export function DeveloperProductsSelectionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: DeveloperProductSelectionContextType }>) {
  return (
    <DeveloperProductsSelectionContext.Provider value={value}>
      {children}
    </DeveloperProductsSelectionContext.Provider>
  );
}

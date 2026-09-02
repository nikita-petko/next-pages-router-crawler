import { createContext, useContext, type ReactNode } from 'react';
import { useImportStore, type ImportStore } from './importStore';

const ImportContext = createContext<ImportStore | null>(null);

export function ImportProvider({ children }: { children: ReactNode }) {
  const store = useImportStore();
  return <ImportContext.Provider value={store}>{children}</ImportContext.Provider>;
}

export function useImport(): ImportStore {
  const ctx = useContext(ImportContext);
  if (!ctx) {
    throw new Error('useImport must be used within ImportProvider');
  }
  return ctx;
}

export function useOptionalImport(): ImportStore | null {
  return useContext(ImportContext);
}

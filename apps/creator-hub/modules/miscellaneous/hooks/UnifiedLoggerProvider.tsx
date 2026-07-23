import defaultUnifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { UnifiedLogger } from '@rbx/unified-logger';
import React, { createContext, FC, useMemo, useContext } from 'react';

type UnifiedLoggerProviderState = { unifiedLogger: UnifiedLogger };
export const UnifiedLoggerProviderContext = createContext<UnifiedLoggerProviderState | null>(null);

export const UnifiedLoggerProvider: FC<
  React.PropsWithChildren<{ unifiedLogger?: UnifiedLogger }>
> = ({ children, unifiedLogger }) => {
  const unifiedLoggerProviderState = useMemo(() => {
    return { unifiedLogger: unifiedLogger ?? defaultUnifiedLoggerClient };
  }, [unifiedLogger]);

  return (
    <UnifiedLoggerProviderContext.Provider value={unifiedLoggerProviderState}>
      {children}
    </UnifiedLoggerProviderContext.Provider>
  );
};

export function useUnifiedLoggerProvider(): UnifiedLoggerProviderState {
  const context = useContext(UnifiedLoggerProviderContext);
  if (context === null) {
    throw new Error('useUnifiedLoggerProvider must be used within a UnifiedLoggerProvider');
  }
  return context;
}

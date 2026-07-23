import type { FC } from 'react';
import React, { createContext, useMemo, useContext, useLayoutEffect } from 'react';
import type { TTag } from '../core/types';
import type UnifiedLogger from '../core/UnifiedLogger';

// PageLoggerConfig is exposed to the client. Do not add sensitive internal business info.
export type PageLoggerConfig = {
  tags?: TTag[];
  rosId?: number;
};

export type PageContext = {
  tags: TTag[];
  rosId: number | undefined;
  path: string | undefined;
};

export type UnifiedLoggerProviderState = {
  unifiedLogger: UnifiedLogger;
  pageContext: PageContext;
};

type Props = React.PropsWithChildren<{
  unifiedLogger: UnifiedLogger;
  pageLoggerConfig?: PageLoggerConfig;
  path?: string;
}>;

const UnifiedLoggerProviderContext = createContext<UnifiedLoggerProviderState | null>(null);

const emptyTags: TTag[] = [];

export const UnifiedLoggerProvider: FC<Props> = ({
  children,
  unifiedLogger,
  pageLoggerConfig,
  path,
}) => {
  const tags = pageLoggerConfig?.tags ?? emptyTags;
  const rosId = pageLoggerConfig?.rosId;

  useLayoutEffect(() => {
    unifiedLogger.setOwnerId?.(rosId);
    unifiedLogger.setPageTags?.(tags);
    unifiedLogger.setPath?.(path);
    return () => {
      unifiedLogger.setOwnerId?.(undefined);
      unifiedLogger.setPageTags?.([]);
      unifiedLogger.setPath?.(undefined);
    };
  }, [unifiedLogger, rosId, tags, path]);

  const state = useMemo<UnifiedLoggerProviderState>(() => {
    const pageContext: PageContext = { tags, rosId, path };
    return { unifiedLogger, pageContext };
  }, [unifiedLogger, tags, rosId, path]);

  return (
    <UnifiedLoggerProviderContext.Provider value={state}>
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

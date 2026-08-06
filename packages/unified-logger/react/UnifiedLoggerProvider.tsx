import type { FC } from 'react';
import React, { createContext, useMemo, useContext, useLayoutEffect, useRef } from 'react';
import type { TTag } from '../core/types';
import type UnifiedLogger from '../core/UnifiedLogger';
import type TaggableEvent from '../event/TaggableEvent';

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
const eventTypes = [
  'pageload',
  'click',
  'impression',
  'hover',
  'webvitals',
  'apivitals',
  'formvitals',
  'error',
  'session',
] as const;
// These document-load metrics may be emitted after navigation but still belong to the initial page.
const coreWebVitalsMetricNames = new Set(['TTFB', 'FCP', 'LCP', 'FID', 'CLS', 'INP']);

const isCoreWebVitalsEvent = (event: TaggableEvent): boolean => {
  const metricName = event.parameters?.metricName;
  return (
    event.eventType === 'webvitals' &&
    metricName !== undefined &&
    coreWebVitalsMetricNames.has(metricName)
  );
};

export const UnifiedLoggerProvider: FC<Props> = ({
  children,
  unifiedLogger,
  pageLoggerConfig,
  path,
}) => {
  const tags = pageLoggerConfig?.tags ?? emptyTags;
  const rosId = pageLoggerConfig?.rosId;
  const pageContext = useMemo<PageContext>(() => ({ tags, rosId, path }), [tags, rosId, path]);
  const initialPageContextRef = useRef(pageContext);
  const pageContextRef = useRef(pageContext);

  useLayoutEffect(() => {
    pageContextRef.current = pageContext;
  }, [pageContext]);

  useLayoutEffect(() => {
    const addPageContext = (event: TaggableEvent) => {
      const eventPageContext = isCoreWebVitalsEvent(event)
        ? initialPageContextRef.current
        : pageContextRef.current;
      if (eventPageContext.path !== undefined) {
        event.parameters = { ...event.parameters, path: eventPageContext.path };
      }
      eventPageContext.tags.forEach((tag) => event.addTag(tag));
      if (eventPageContext.rosId !== undefined) {
        event.addTag(`owner: ${eventPageContext.rosId}`);
      }
    };

    eventTypes.forEach((eventType) => {
      unifiedLogger.events.on(eventType, addPageContext);
    });

    return () => {
      eventTypes.forEach((eventType) => {
        unifiedLogger.events.off(eventType, addPageContext);
      });
    };
  }, [unifiedLogger]);

  const state = useMemo<UnifiedLoggerProviderState>(
    () => ({ unifiedLogger, pageContext }),
    [unifiedLogger, pageContext],
  );

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

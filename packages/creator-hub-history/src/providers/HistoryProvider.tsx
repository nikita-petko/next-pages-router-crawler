/**
 * React context provider that automatically tracks page visits.
 *
 * On each Next.js route change it starts a {@link StabilizationDetector},
 * waits for `<head>` metadata to settle, then persists the collected
 * metadata via {@link HistoryClient}. Also exposes manual tracking,
 * retrieval, removal, and clearing methods through context.
 */

import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import type { FC } from 'react';
import { useRouter } from 'next/router';
import historyClient from '../clients/historyClient';
import type { HistoryItem, HistoryItemMetadata } from '../schema';
import { HISTORY_CONFIG } from '../config';
import cleanUrl from '../utils/cleanUrl';
import { MetadataCollector } from '../collectors/metadataCollector';
import type { CollectedMetadata } from '../collectors/metadataCollector';
import StabilizationDetector from '../observers/stabilizationDetector';

export interface HistoryEventLogger {
  logClickEvent: (params: { eventName: string; parameters: Record<string, string> }) => void;
  logImpressionEvent: (params: { eventName: string; parameters: Record<string, string> }) => void;
}

/** Shape of the context value exposed to consumers via useHistory(). */
export type HistoryProviderContext = {
  eventLogger?: HistoryEventLogger;
  trackPageVisit: (path: string, title?: string) => Promise<void>;
  getRecentlyVisited: (limit?: number) => Promise<HistoryItem[]>;
  removeFromHistory: (itemId: string) => Promise<HistoryItem[]>;
  clearHistory: () => Promise<void>;
};

/**
 * Default context — methods throw so consumers get a clear error if
 * they forget to wrap with `<HistoryProvider>`.
 */
export const HistoryContext = createContext<HistoryProviderContext>({
  trackPageVisit: async () => {
    throw new Error('trackPageVisit is not implemented');
  },
  getRecentlyVisited: async () => {
    throw new Error('getRecentlyVisited is not implemented');
  },
  removeFromHistory: async () => {
    throw new Error('removeFromHistory is not implemented');
  },
  clearHistory: async () => {
    throw new Error('clearHistory is not implemented');
  },
  eventLogger: undefined,
});

type HistoryProviderProps = {
  /**
   * Authenticated user's ID. When provided, history is stored in a
   * user-scoped localStorage key (`Creator.RecentlyVisited.{userId}`).
   * On login (undefined → userId), anonymous history is merged into the
   * user's key. On logout (userId → undefined), switches back to the
   * anonymous key. Pass `undefined` for anonymous/unauthenticated users.
   */
  userId?: string;
  /**
   * Optional callback to supply additional metadata for a given path.
   * Merged into the DOM-collected metadata before saving. Useful for
   * injecting data that isn't available in meta tags (e.g. search-specific
   * display hints from `@rbx/creator-hub-search`).
   */
  getMetadataForPath?: (path: string) => Partial<HistoryItemMetadata> | undefined;
  eventLogger?: HistoryEventLogger;
};

/** SSR-safe wrapper around cleanUrl — returns empty strings during SSR. */
function getCleanUrl(): { id: string; cleanedUrl: string; originalUrl: string } {
  if (typeof window === 'undefined') return { id: '', cleanedUrl: '', originalUrl: '' };
  return cleanUrl(window.location);
}

export const HistoryProvider: FC<React.PropsWithChildren<HistoryProviderProps>> = ({
  children,
  userId,
  getMetadataForPath,
  eventLogger,
}) => {
  const router = useRouter();
  /** Singleton collector — reads metadata from the DOM on demand. */
  const collectorRef = useRef(new MetadataCollector());
  /** Singleton detector — watches <head> mutations for stabilisation. */
  const detectorRef = useRef(new StabilizationDetector());

  /** Switch storage key when the authenticated user changes. */
  useEffect(() => {
    historyClient.setActiveUser(userId);
  }, [userId]);

  /**
   * Called by StabilizationDetector once `<head>` metadata has settled.
   * Builds a HistoryItemMetadata from the DOM-collected values, skips
   * excluded paths, then persists via historyClient.
   */
  const trackFromMetadata = useCallback((collected: CollectedMetadata) => {
    const { id, originalUrl } = getCleanUrl();

    const shouldSkip = HISTORY_CONFIG.pathsToSkip.some((regex) => regex.test(id));
    if (shouldSkip || !collected.title) return;

    const { title, ...optionalFields } = collected;
    const metadata: HistoryItemMetadata = {
      title,
      path: originalUrl,
      ...optionalFields,
    };

    historyClient.addToRecentlyVisited({ id, metadata, accessedAt: Date.now() });
  }, []);

  /**
   * Manual tracking entry point exposed via context.
   * The `path` parameter is unused — the current window.location is
   * always used to derive the id and URL, ensuring consistency with
   * auto-tracked visits. The parameter is kept for API compatibility.
   * Uses document.title as fallback when no explicit title is provided.
   * Merges custom metadata from getMetadataForPath if supplied.
   */
  const trackPageVisit = useCallback(
    async (_path: string, title?: string) => {
      const { id, originalUrl } = getCleanUrl();

      const shouldSkip = HISTORY_CONFIG.pathsToSkip.some((regex) => regex.test(id));
      if (shouldSkip) return;

      try {
        let metadata: HistoryItemMetadata = {
          title: title || document?.title || id,
          path: originalUrl,
        };

        if (getMetadataForPath) {
          const customMetadata = getMetadataForPath(id);
          if (customMetadata) {
            metadata = { ...metadata, ...customMetadata };
          }
        }

        if (!metadata.title) return;

        await historyClient.addToRecentlyVisited({
          id,
          metadata,
          accessedAt: Date.now(),
        });
      } catch {
        // Silently ignore — localStorage or DOM may be unavailable
      }
    },
    [getMetadataForPath],
  );

  /** @returns Recently visited items, capped at `limit` (default: maxItems). */
  const getRecentlyVisited = useCallback(
    async (limit?: number): Promise<HistoryItem[]> => historyClient.getRecentlyVisited(limit),
    [],
  );

  /** Remove a single item by id and return the remaining list. */
  const removeFromHistory = useCallback(
    async (itemId: string): Promise<HistoryItem[]> =>
      historyClient.removeFromRecentlyVisited(itemId),
    [],
  );

  /** Delete all history from localStorage. */
  const clearHistory = useCallback(async (): Promise<void> => historyClient.clearHistory(), []);

  /**
   * Auto-tracking effect: on mount and each Next.js route change,
   * starts the stabilisation detector which waits for <head> to settle
   * then calls trackFromMetadata. Cleans up observer + timers on unmount.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const detector = detectorRef.current;
    const currentCollector = collectorRef.current;

    const startDetection = () => {
      detector.detect(currentCollector, (collected) => {
        trackFromMetadata(collected);
      });
    };

    // Track the initial page load
    startDetection();

    const handleRouteChange = () => {
      startDetection();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      detector.cleanup();
    };
  }, [router.events, trackFromMetadata]);

  const contextValue = useMemo(
    () => ({
      trackPageVisit,
      getRecentlyVisited,
      removeFromHistory,
      clearHistory,
      eventLogger,
    }),
    [trackPageVisit, getRecentlyVisited, removeFromHistory, clearHistory, eventLogger],
  );

  return <HistoryContext.Provider value={contextValue}>{children}</HistoryContext.Provider>;
};

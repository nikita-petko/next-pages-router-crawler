import React, { createContext, useContext, useMemo } from 'react';
import type { UnifiedLogger } from '@rbx/unified-logger';
import { createSearchEventLogger } from '../eventStream/implementations/unifiedLoggerClient';
import {
  DEFAULT_CREATOR_HUB_SEARCH_VERSION,
  type CreatorHubSearchIxpParams,
} from '../types/creatorHubSearchIxp';
import { robloxSiteDomainDevelopment } from '../utilities/getBasePaths';

/**
 * Context value for the search package.
 */
export interface SearchConfig {
  /**
   * The Roblox site domain (e.g., 'roblox.com', 'sitetest1.robloxlabs.com')
   * @default robloxSiteDomainDevelopment
   */
  robloxSiteDomain: string;

  /** Event logger for search events, configured for the current environment */
  eventLogger: UnifiedLogger;

  /**
   * Identifies which host app fires search events.
   * Sourced from `NavigationConfigsProvider.currentProduct` via `CreatorHubLayout`.
   * Included in every event's `parameters.currentProduct` for pipeline segmentation.
   * @default 'CreatorDashboard'
   */
  currentProduct: string;

  /**
   * Resolved `searchVersion` from Creator Hub search IXP (`CreatorHub.CreatorDocumentation.Search.UserId`).
   * Wired from navigation when using Creator Hub shell.
   */
  creatorHubSearchIxpParams: CreatorHubSearchIxpParams;
}

const defaultConfig: SearchConfig = {
  robloxSiteDomain: robloxSiteDomainDevelopment,
  eventLogger: createSearchEventLogger(robloxSiteDomainDevelopment),
  currentProduct: 'CreatorDashboard',
  creatorHubSearchIxpParams: DEFAULT_CREATOR_HUB_SEARCH_VERSION,
};

const SearchConfigContext = createContext<SearchConfig>(defaultConfig);
SearchConfigContext.displayName = 'SearchConfigContext';

export interface SearchConfigProviderProps {
  /**
   * The Roblox site domain (e.g., 'roblox.com', 'sitetest1.robloxlabs.com')
   */
  robloxSiteDomain?: string;

  /**
   * Identifies which host app fires search events.
   * Sourced from `NavigationConfigsProvider.currentProduct` in `CreatorHubLayout`.
   * Values: `'CreatorDashboard'`, `'Documentation'`, `'Store'`, `'Talent'`, etc.
   * @default 'CreatorDashboard'
   */
  currentProduct?: string;

  /**
   * Resolved `searchVersion` from layer `CreatorHub.CreatorDocumentation.Search.UserId` (navigation embed).
   * Kept on the provider so navigation can keep wiring it through; consumed by the
   * future v3 rollout.
   */
  creatorHubSearchIxpParams?: CreatorHubSearchIxpParams;

  children: React.ReactNode;
}

/**
 * Provider for search configuration.
 *
 * @example
 * ```tsx
 * <SearchConfigProvider robloxSiteDomain={robloxSiteDomain}>
 *   <SearchContainer />
 * </SearchConfigProvider>
 * ```
 */
export function SearchConfigProvider({
  robloxSiteDomain = 'roblox.com',
  currentProduct = 'CreatorDashboard',
  creatorHubSearchIxpParams = DEFAULT_CREATOR_HUB_SEARCH_VERSION,
  children,
}: SearchConfigProviderProps) {
  const eventLogger = useMemo(() => createSearchEventLogger(robloxSiteDomain), [robloxSiteDomain]);

  const config = useMemo<SearchConfig>(
    () => ({
      robloxSiteDomain,
      eventLogger,
      currentProduct,
      creatorHubSearchIxpParams,
    }),
    [robloxSiteDomain, eventLogger, currentProduct, creatorHubSearchIxpParams],
  );

  return <SearchConfigContext.Provider value={config}>{children}</SearchConfigContext.Provider>;
}

/**
 * Hook to access search configuration.
 */
export function useSearchConfig(): SearchConfig {
  return useContext(SearchConfigContext);
}

export default SearchConfigContext;

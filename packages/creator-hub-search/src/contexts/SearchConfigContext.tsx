import React, { createContext, useContext, useMemo } from 'react';
import { Configuration } from '@rbx/clients-core';
import { SearchApi } from '@rbx/client-universes-api/v1';
import { GroupsApi } from '@rbx/client-creator-home-api/v1';
import { UniversesApi as OrgsUniversesApi } from '@rbx/client-organizations-service-api/v1';
import type { UnifiedLogger } from '@rbx/unified-logger';
import { getBEDEV2ServiceBasePath, robloxSiteDomainDevelopment } from '../utilities/getBasePaths';
import type { ExperiencePermissions } from '../clients/permissionTypes';
import type { PermissionClient } from '../clients/permissionClient';
import { createPermissionClient } from '../clients/permissionClient';
import { createSearchEventLogger } from '../eventStream/implementations/unifiedLoggerClient';

/**
 * API clients created by the provider for the correct environment.
 */
export interface SearchClients {
  /** Client for searching universes (experiences) */
  universesSearchApi: SearchApi;
  /** Client for listing user groups */
  groupsApi: GroupsApi;
  /** Permission client bundling all permission-related logic (fetch, cache, checks) */
  permissionClient: PermissionClient;
}

/**
 * Context value for the search package.
 */
export interface SearchConfig {
  /**
   * The Roblox site domain (e.g., 'roblox.com', 'sitetest1.robloxlabs.com')
   * @default robloxSiteDomainDevelopment
   */
  robloxSiteDomain: string;

  /** API clients for the configured environment */
  clients: SearchClients;

  /** Event logger for search events, configured for the current environment */
  eventLogger: UnifiedLogger;

  /**
   * Identifies which host app fires search events.
   * Sourced from `NavigationConfigsProvider.currentProduct` via `CreatorHubLayout`.
   * Included in every event's `parameters.currentProduct` for pipeline segmentation.
   * @default 'CreatorDashboard'
   */
  currentProduct: string;
}

function createSearchClients(robloxSiteDomain: string) {
  const universesSearchApi = new SearchApi(
    new Configuration({
      robloxSiteDomain,
      basePath: getBEDEV2ServiceBasePath('universes', robloxSiteDomain),
      credentials: 'include',
    }),
  );

  const groupsApi = new GroupsApi(
    new Configuration({
      robloxSiteDomain,
      basePath: getBEDEV2ServiceBasePath('creator-home-api', robloxSiteDomain),
      credentials: 'include',
    }),
  );

  return { universesSearchApi, groupsApi };
}

function createDefaultFetchPermissions(
  robloxSiteDomain: string,
): (universeId: string) => Promise<ExperiencePermissions> {
  const orgsUniversesApi = new OrgsUniversesApi(
    new Configuration({
      robloxSiteDomain,
      basePath: getBEDEV2ServiceBasePath('orgs', robloxSiteDomain),
      credentials: 'include',
    }),
  );

  return async (universeId: string): Promise<ExperiencePermissions> => {
    const resolved = await orgsUniversesApi.v2UniversesUniverseIdPermissionsResolvedGet({
      universeId,
    });
    return {
      canConfigure: resolved.edit,
      // NOTE(@neoxu 2026-02-09): The navigation uses userCanViewAnalyticsForUniverse from the
      // Analytics Flags / Obelix endpoint. For MVP we source it from the Organizations API's
      // resolved.viewAnalytics which represents the same permission. Post-MVP, align the source
      // with the Analytics Feature Flags endpoint (getfeaturePermissionsGetFeaturePermission).
      userCanViewAnalyticsForUniverse: resolved.viewAnalytics,
      monetizeExperience: resolved.monetizeExperience,
    };
  };
}

const defaultConfig: SearchConfig = {
  robloxSiteDomain: robloxSiteDomainDevelopment,
  clients: {
    ...createSearchClients(robloxSiteDomainDevelopment),
    permissionClient: createPermissionClient(
      createDefaultFetchPermissions(robloxSiteDomainDevelopment),
    ),
  },
  eventLogger: createSearchEventLogger(robloxSiteDomainDevelopment),
  currentProduct: 'CreatorDashboard',
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

  children: React.ReactNode;
}

/**
 * Provider for search configuration and API clients.
 *
 * Creates environment-aware API clients and a PermissionClient via useMemo
 * (following NotificationClientProvider pattern). Consumers access them
 * via useSearchConfig().
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
  children,
}: SearchConfigProviderProps) {
  const clients = useMemo<SearchClients>(
    () => ({
      ...createSearchClients(robloxSiteDomain),
      permissionClient: createPermissionClient(createDefaultFetchPermissions(robloxSiteDomain)),
    }),
    [robloxSiteDomain],
  );

  const eventLogger = useMemo(() => createSearchEventLogger(robloxSiteDomain), [robloxSiteDomain]);

  const config = useMemo<SearchConfig>(
    () => ({
      robloxSiteDomain,
      clients,
      eventLogger,
      currentProduct,
    }),
    [robloxSiteDomain, clients, eventLogger, currentProduct],
  );

  return <SearchConfigContext.Provider value={config}>{children}</SearchConfigContext.Provider>;
}

/**
 * Hook to access search configuration, API clients, and permission client.
 */
export function useSearchConfig(): SearchConfig {
  return useContext(SearchConfigContext);
}

export default SearchConfigContext;

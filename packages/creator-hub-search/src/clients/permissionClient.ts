/**
 * Permission client for search result filtering.
 *
 * Provides a PermissionClient interface that bundles permission fetching,
 * caching, and page-level visibility checks. Created by SearchConfigProvider
 * and injected via context so the cache is tied to the provider lifecycle.
 *
 * Page visibility is determined by shouldShowPage() in permissionTypes.ts,
 * which uses a fail-closed model: pages without a matching permission rule
 * are hidden from search results by default.
 */
import type { ExperiencePermissions } from './permissionTypes';
import { shouldShowPage, OWNER_PERMISSIONS } from './permissionTypes';

export { UniversesApi as OrgsUniversesApi } from '@rbx/client-organizations-service-api/v1';

/** Map of groupId → resolved permissions for that group */
export type GroupPermissionsMap = Map<string, ExperiencePermissions>;

/** Map of groupId → a sample universeId from that group (used to fetch permissions) */
export type GroupUniverseMap = Map<string, string>;

/**
 * Bundles all permission-related logic for search result filtering.
 * Created per-provider instance so the cache is tied to the provider lifecycle.
 */
export interface PermissionClient {
  /** Fetch resolved permissions for a single universe */
  fetchExperiencePermissions: (universeId: string) => Promise<ExperiencePermissions>;

  /**
   * Fetch permissions for multiple groups in parallel (with caching).
   * Each group only needs 1 API call using any universeId from that group.
   * @param groupUniverseMap - Map of groupId → sampleUniverseId
   */
  fetchPermissionsForGroups: (groupUniverseMap: GroupUniverseMap) => Promise<GroupPermissionsMap>;

  /** Check if a page should be visible given permissions (fail-closed: unknown pages are hidden) */
  shouldShowPage: (identifier: string, permissions: ExperiencePermissions) => boolean;

  /** Full permissions for personal experiences (owner always has all permissions) */
  OWNER_PERMISSIONS: ExperiencePermissions;

  /** Clear the internal permissions cache */
  clearCache: () => void;
}

/**
 * Creates a PermissionClient instance with its own in-memory cache.
 *
 * @param fetchFn - Function that fetches resolved permissions for a universe.
 *   Typically created from OrgsUniversesApi in SearchConfigProvider.
 */
export function createPermissionClient(
  fetchFn: (universeId: string) => Promise<ExperiencePermissions>,
): PermissionClient {
  // Per-instance cache: groupId → permissions
  const groupPermissionsCache: GroupPermissionsMap = new Map();

  const fetchPermissionsForGroups = async (
    groupUniverseMap: GroupUniverseMap,
  ): Promise<GroupPermissionsMap> => {
    const results: GroupPermissionsMap = new Map();

    // Separate cached vs uncached
    const uncachedGroups: Array<[string, string]> = [];
    Array.from(groupUniverseMap.entries()).forEach(([groupId, universeId]) => {
      const cached = groupPermissionsCache.get(groupId);
      if (cached) {
        results.set(groupId, cached);
      } else {
        uncachedGroups.push([groupId, universeId]);
      }
    });

    // Fetch uncached in parallel
    if (uncachedGroups.length > 0) {
      const fetchResults = await Promise.allSettled(
        uncachedGroups.map(async ([groupId, universeId]) => {
          const permissions = await fetchFn(universeId);
          return { groupId, permissions };
        }),
      );

      fetchResults.forEach((result, i) => {
        const [groupId] = uncachedGroups[i];

        if (result.status === 'fulfilled') {
          groupPermissionsCache.set(groupId, result.value.permissions);
          results.set(groupId, result.value.permissions);
        }
        // On fetch failure: omit from results → buildDataset treats as no permissions available
        // for this group → documents are included unfiltered. The page-level permission gate
        // in creator-hub is still the ultimate source of truth.
      });
    }

    return results;
  };

  return {
    fetchExperiencePermissions: fetchFn,
    fetchPermissionsForGroups,
    shouldShowPage,
    OWNER_PERMISSIONS,
    clearCache: () => groupPermissionsCache.clear(),
  };
}

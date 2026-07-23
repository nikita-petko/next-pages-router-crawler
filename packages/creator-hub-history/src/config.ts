/**
 * Package-wide constants and configuration.
 *
 * Contains storage keys, stabilization timing, the `hub:` meta prefix,
 * title separator, and the `SiteName` enum.
 */

export type HistoryConfig = {
  maxItems: number;
  maxStoredItems: number;
  maxDaysAgo: number;
  queryParamsToKeep: string[];
  pathsToSkip: RegExp[];
};

export const HISTORY_CONFIG: HistoryConfig = {
  maxItems: 10,
  maxStoredItems: 100,
  maxDaysAgo: 7 * 20, // 20 weeks
  queryParamsToKeep: ['activeTab', 'tab'],
  pathsToSkip: [/^\/api(\/.*)?\/?$/, /^\/_next(\/.*)?\/?$/, /^\/404$/, /^\/500$/],
};

export const STORAGE_KEY = 'Creator.RecentlyVisited';

/**
 * Build a user-scoped localStorage key.
 * Returns the anonymous key ({@link STORAGE_KEY}) when userId is absent,
 * or `Creator.RecentlyVisited.{userId}` for authenticated users.
 */
export function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY}.${userId}` : STORAGE_KEY;
}

/**
 * Previous localStorage keys used by older versions of the history feature.
 * On first read, {@link HistoryClient} migrates data from these keys into
 * {@link STORAGE_KEY}, then deletes them. This ensures existing users don't
 * lose their recently visited history after the upgrade.
 *
 * TODO(@neoxu 2025-02-23): Safe to remove once enough time has passed
 * after the production release that all active users have been migrated
 * (e.g. 1–2 months).
 */
export const LEGACY_STORAGE_KEYS = ['CreatorDocumentation.RecentlyVisited'];

/**
 * Quiet window (ms). After each route change the detector starts a timer;
 * every `<head>` mutation resets it. When no mutations occur for this
 * duration, metadata is considered stable and the page visit is recorded.
 */
export const STABILIZATION_MS = 300;

/**
 * Hard timeout (ms). If `<head>` keeps mutating beyond this limit
 * (e.g. a slow async component continuously updating meta tags),
 * the detector stops waiting and records whatever metadata is present.
 */
export const STABILIZATION_MAX_MS = 3000;

/**
 * Post-settle watch window (ms). After the initial metadata capture,
 * a lightweight observer continues watching for `hub:title` changes.
 * Page-level `<HubMeta hubOnly>` components may render after the primary
 * stabilisation (e.g. translations still loading on hard refresh).
 * If `hub:title` changes within this window, metadata is re-collected
 * and the history entry is updated in-place.
 */
export const POST_SETTLE_WATCH_MS = 5000;

export const HUB_META_PREFIX = 'hub:';

export const TITLE_SEPARATOR = ' / ';

export enum SiteName {
  CreatorHub = 'Creator Hub',
  Store = 'Store',
  TalentHub = 'Talent Hub',
  Learn = 'Learn',
}

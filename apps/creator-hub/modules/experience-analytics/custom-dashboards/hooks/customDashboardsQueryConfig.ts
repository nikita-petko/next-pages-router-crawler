/**
 * Shared React-Query tunables and keys for custom dashboards. The
 * service-subscription bridge invalidates on every successful mutation
 * (including cross-tab `storage` events), so long-but-finite stale windows
 * are safe.
 *
 * Consumed by the `useDashboardsListQuery` / `useDashboardDocumentQuery` /
 * `suggestDefaultName` hooks that land in the manage and editor stacked PRs.
 */

export const LIST_STALE_TIME_MS = 30_000;
export const DETAIL_STALE_TIME_MS = 30_000;
export const SUGGESTED_NAME_STALE_TIME_MS = 60_000;

/** React-Query keys, hierarchical (universe → list/detail/suggested-name). */
export const customDashboardQueryKeys = {
  universe: (universeId: number) => ['custom-dashboards', 'universe', universeId] as const,

  list: (
    universeId: number,
    options?: { readonly pageSize?: number; readonly pageToken?: string },
  ) => {
    const root = ['custom-dashboards', 'universe', universeId, 'list'] as const;
    return options
      ? ([...root, options.pageSize ?? null, options.pageToken ?? null] as const)
      : root;
  },

  detail: (universeId: number, dashboardId: string) =>
    ['custom-dashboards', 'universe', universeId, 'detail', dashboardId] as const,

  suggestedName: (universeId: number) =>
    ['custom-dashboards', 'universe', universeId, 'suggested-name'] as const,
};

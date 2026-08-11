import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import {
  useOptionalCustomDashboardService,
  useOptionalCustomDashboardsBackendState,
} from '../service/CustomDashboardServiceProvider';
import type { CustomDashboardListOptions, CustomDashboardListResult } from '../types';
import { LIST_STALE_TIME_MS, customDashboardQueryKeys } from './customDashboardsQueryConfig';

type UseDashboardsListQueryOptions = CustomDashboardListOptions & {
  readonly enabled?: boolean;
  readonly allowMissingProvider?: boolean;
};

/**
 * Reads dashboards for the given universe via the `CustomDashboardService`
 * seam. Pass `pageSize` / `pageToken` for API-backed paging. The query key
 * matches the one fanned out by `useServiceSubscription`.
 */
export function useDashboardsListQuery(
  universeId: number,
  options?: UseDashboardsListQueryOptions,
) {
  const service = useOptionalCustomDashboardService();
  const { isReady: isBackendReady } = useOptionalCustomDashboardsBackendState();
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
    { universeId },
  );
  const listOptions: CustomDashboardListOptions | undefined =
    options?.pageSize !== undefined || options?.pageToken !== undefined
      ? { pageSize: options.pageSize, pageToken: options.pageToken }
      : undefined;

  const query = useQuery<CustomDashboardListResult>({
    queryKey: customDashboardQueryKeys.list(universeId, listOptions),
    queryFn: () => {
      if (!service) {
        throw new Error('Custom dashboard service is unavailable.');
      }
      return service.list(universeId, listOptions);
    },
    staleTime: LIST_STALE_TIME_MS,
    enabled:
      isCustomDashboardsReady &&
      isCustomDashboardsEnabled &&
      isBackendReady &&
      service !== null &&
      (options?.enabled ?? true) &&
      Number.isFinite(universeId) &&
      universeId > 0,
  });
  if (!service && options?.allowMissingProvider !== true) {
    throw new Error(
      'useDashboardsListQuery() must be used within a CustomDashboardServiceProvider.',
    );
  }
  return query;
}

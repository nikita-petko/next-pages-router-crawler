import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import {
  useCustomDashboardService,
  useCustomDashboardsBackendState,
} from '../service/CustomDashboardServiceProvider';
import type { CustomDashboardListOptions, CustomDashboardListResult } from '../types';
import { LIST_STALE_TIME_MS, customDashboardQueryKeys } from './customDashboardsQueryConfig';

type UseDashboardsListQueryOptions = CustomDashboardListOptions & {
  readonly enabled?: boolean;
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
  const service = useCustomDashboardService();
  const { isReady: isBackendReady } = useCustomDashboardsBackendState();
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const listOptions: CustomDashboardListOptions | undefined =
    options?.pageSize !== undefined || options?.pageToken !== undefined
      ? { pageSize: options.pageSize, pageToken: options.pageToken }
      : undefined;

  return useQuery<CustomDashboardListResult>({
    queryKey: customDashboardQueryKeys.list(universeId, listOptions),
    queryFn: () => service.list(universeId, listOptions),
    staleTime: LIST_STALE_TIME_MS,
    enabled:
      isCustomDashboardsReady &&
      isCustomDashboardsEnabled &&
      isBackendReady &&
      (options?.enabled ?? true) &&
      Number.isFinite(universeId) &&
      universeId > 0,
  });
}

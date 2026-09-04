import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import {
  useOptionalCustomDashboardService,
  useOptionalCustomDashboardsBackendState,
} from '../service/CustomDashboardServiceProvider';
import { LIST_STALE_TIME_MS, customDashboardQueryKeys } from './customDashboardsQueryConfig';

type UsePinnedDashboardsQueryOptions = {
  readonly enabled?: boolean;
  readonly allowMissingProvider?: boolean;
};

type PinnedDashboard = {
  readonly id: string;
  readonly name: string;
};

/** Reads only pinned dashboard navigation entries for a universe. */
export function usePinnedDashboardsQuery(
  universeId: number,
  options?: UsePinnedDashboardsQueryOptions,
) {
  const service = useOptionalCustomDashboardService();
  const { isReady: isBackendReady } = useOptionalCustomDashboardsBackendState();
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
    { universeId },
  );

  const query = useQuery<ReadonlyArray<PinnedDashboard>>({
    queryKey: customDashboardQueryKeys.pinned(universeId),
    queryFn: () => {
      if (!service) {
        throw new Error('Custom dashboard service is unavailable.');
      }
      if (service.listPinned) {
        return service.listPinned(universeId);
      }
      return service
        .list(universeId)
        .then((result) =>
          result.items
            .filter((dashboard) => dashboard.isPinned)
            .map(({ id, name }) => ({ id, name })),
        );
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
      'usePinnedDashboardsQuery() must be used within a CustomDashboardServiceProvider.',
    );
  }
  return query;
}

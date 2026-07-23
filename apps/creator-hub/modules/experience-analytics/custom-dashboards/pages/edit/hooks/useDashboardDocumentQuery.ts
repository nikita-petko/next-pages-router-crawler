import { useQuery } from '@tanstack/react-query';
import { CustomDashboardNotFoundError } from '../../../errors';
import {
  DETAIL_STALE_TIME_MS,
  customDashboardQueryKeys,
} from '../../../hooks/customDashboardsQueryConfig';
import {
  useCustomDashboardService,
  useCustomDashboardsBackendState,
} from '../../../service/CustomDashboardServiceProvider';
import type { CustomDashboardDocument } from '../../../types';

/** Single-document query, gated until both ids resolve. */
function useDashboardDocumentQuery(universeId: number, dashboardId: string | undefined) {
  const service = useCustomDashboardService();
  const { isReady: isBackendReady } = useCustomDashboardsBackendState();
  const enabled =
    isBackendReady &&
    Number.isFinite(universeId) &&
    universeId > 0 &&
    typeof dashboardId === 'string' &&
    dashboardId.length > 0;

  return useQuery<CustomDashboardDocument>({
    queryKey: customDashboardQueryKeys.detail(universeId, dashboardId ?? ''),
    queryFn: () => {
      if (!dashboardId) {
        return Promise.reject(new CustomDashboardNotFoundError(''));
      }
      return service.get(universeId, dashboardId);
    },
    staleTime: DETAIL_STALE_TIME_MS,
    enabled,
    // NotFound is terminal; retrying just re-confirms the absence.
    retry: (failureCount, error) => {
      if (error instanceof CustomDashboardNotFoundError) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export default useDashboardDocumentQuery;

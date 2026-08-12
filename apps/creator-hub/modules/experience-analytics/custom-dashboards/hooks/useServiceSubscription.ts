import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import { useCustomDashboardService } from '../service/CustomDashboardServiceProvider';
import { customDashboardQueryKeys } from './customDashboardsQueryConfig';

/**
 * Wire the service's change notifications into React Query invalidation.
 * Mount once from `CustomDashboardsShell` (or equivalent). Every mutation
 * we observe (including cross-tab `storage` events) triggers a precise
 * invalidation of the affected rows.
 *
 * `external` events (cross-tab) target the entire universe prefix in one
 * call — RQ's prefix matching invalidates list, detail, and suggested-name
 * subtrees so we don't pay for three separate invalidate calls.
 */
export function useCustomDashboardServiceSubscription(universeId: number): void {
  const service = useCustomDashboardService();
  const queryClient = useQueryClient();
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
    { universeId },
  );

  useEffect(() => {
    if (!isCustomDashboardsReady || !isCustomDashboardsEnabled) {
      return undefined;
    }

    const unsubscribe = service.subscribe((event) => {
      if (event.eventType === 'external') {
        void queryClient.invalidateQueries({
          queryKey: customDashboardQueryKeys.universe(event.universeId),
        });
        return;
      }
      // Pin / unpin: the optimistic update already flipped `isPinned` in
      // the shared list cache (so the side nav and the current manage
      // page reflect the new state in place). Mark the list stale WITHOUT
      // refetching so the manage table doesn't reorder mid-toggle; the
      // reorder lands on the next page switch, remount, or manual refresh
      // when the now-stale query is reobserved. Detail is invalidated
      // normally so an open dashboard view reflects the new pin metadata.
      // Suggested-name is unaffected by pinning, so it's left alone.
      if (event.eventType === 'pin' || event.eventType === 'unpin') {
        void queryClient.invalidateQueries({
          queryKey: customDashboardQueryKeys.list(event.universeId),
          refetchType: 'none',
        });
        void queryClient.invalidateQueries({
          queryKey: customDashboardQueryKeys.detail(event.universeId, event.dashboardId),
        });
        return;
      }
      // Other mutation-scoped events: precisely invalidate list, suggested
      // name, and the affected detail row.
      void queryClient.invalidateQueries({
        queryKey: customDashboardQueryKeys.list(event.universeId),
      });
      void queryClient.invalidateQueries({
        queryKey: customDashboardQueryKeys.suggestedName(event.universeId),
      });
      void queryClient.invalidateQueries({
        queryKey: customDashboardQueryKeys.detail(event.universeId, event.dashboardId),
      });
    });
    return unsubscribe;
  }, [isCustomDashboardsEnabled, isCustomDashboardsReady, service, queryClient]);
}

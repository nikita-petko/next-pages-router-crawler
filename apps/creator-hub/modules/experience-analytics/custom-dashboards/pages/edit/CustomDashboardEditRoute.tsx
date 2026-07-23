import { useCallback } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { analyticsCustomDashboardsManageNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import CustomDashboardsShell from '../../shell/CustomDashboardsShell';
import { NEW_CHART_TILE_ROUTE_ID } from '../chartEditor/chartTileDraft';
import EditPageContent from './EditPageContent';

const CustomDashboardEditRoute: NextLayoutPage = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const dashboardIdParam = router.query.dashboardId;
  const draftIdParam = router.query.draftId;
  const dashboardId = typeof dashboardIdParam === 'string' ? dashboardIdParam : undefined;
  const draftId = typeof draftIdParam === 'string' ? draftIdParam : undefined;

  const handleBackToManage = useCallback(() => {
    const experienceId = router.query.id;
    if (!experienceId || Array.isArray(experienceId)) {
      return;
    }
    void router.push(`/dashboard/creations/experiences/${experienceId}/analytics/dashboards`);
  }, [router]);

  const handleOpenChartEditor = useCallback(
    (tileId: string | undefined, nextDraftId: string) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId) || !dashboardId) {
        return;
      }
      const resolvedTileId = tileId ?? NEW_CHART_TILE_ROUTE_ID;
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${dashboardId}/tile/${resolvedTileId}/edit?draftId=${nextDraftId}`,
      );
    },
    [dashboardId, router],
  );

  const handleOpenPreview = useCallback(
    (nextDraftId: string) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId) || !dashboardId) {
        return;
      }
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${dashboardId}/preview?draftId=${nextDraftId}`,
      );
    },
    [dashboardId, router],
  );
  const handleOpenView = useCallback(
    (nextDashboardId: string) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId)) {
        return;
      }
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${nextDashboardId}`,
      );
    },
    [router],
  );

  const handleDraftSessionReady = useCallback(
    (nextDraftId: string) => {
      if (router.query.draftId === nextDraftId) {
        return;
      }
      // Shallow replace: surface the live draftId in the URL without re-running
      // data fetching or pushing a history entry, so a reload/refetch re-attaches
      // to the same in-memory editing session.
      void router.replace(
        { pathname: router.pathname, query: { ...router.query, draftId: nextDraftId } },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  return (
    <CustomDashboardsShell>
      <EditPageContent
        universeId={universeId}
        dashboardId={dashboardId}
        draftId={draftId}
        onBackToManage={handleBackToManage}
        onOpenChartEditor={handleOpenChartEditor}
        onOpenPreview={handleOpenPreview}
        onOpenView={handleOpenView}
        onDraftSessionReady={handleDraftSessionReady}
      />
    </CustomDashboardsShell>
  );
};

CustomDashboardEditRoute.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCustomDashboardsManageNavigationItem,
    omitPageTitle: true,
  });
CustomDashboardEditRoute.loggerConfig = { rosId: RosTeams.Analytics };

export default CustomDashboardEditRoute;

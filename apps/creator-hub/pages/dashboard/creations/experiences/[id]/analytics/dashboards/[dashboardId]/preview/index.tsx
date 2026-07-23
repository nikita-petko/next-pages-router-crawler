import { useCallback } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { analyticsCustomDashboardsManageNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import DashboardPreviewPage from '@modules/experience-analytics/custom-dashboards/pages/preview/DashboardPreviewPage';
import CustomDashboardsShell from '@modules/experience-analytics/custom-dashboards/shell/CustomDashboardsShell';

const CustomDashboardPreviewRoute: NextLayoutPage = () => {
  const router = useRouter();
  const dashboardIdParam = router.query.dashboardId;
  const draftIdParam = router.query.draftId;
  const dashboardId = typeof dashboardIdParam === 'string' ? dashboardIdParam : undefined;
  const draftId = typeof draftIdParam === 'string' ? draftIdParam : undefined;

  const handleBackToEditor = useCallback(() => {
    const experienceId = router.query.id;
    if (!experienceId || Array.isArray(experienceId) || !dashboardId) {
      return;
    }
    const query = draftId ? `?draftId=${draftId}` : '';
    void router.push(
      `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${dashboardId}/edit${query}`,
    );
  }, [dashboardId, draftId, router]);

  return (
    <CustomDashboardsShell>
      <DashboardPreviewPage draftId={draftId} onBackToEditor={handleBackToEditor} />
    </CustomDashboardsShell>
  );
};

CustomDashboardPreviewRoute.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCustomDashboardsManageNavigationItem,
    omitPageTitle: true,
  });
CustomDashboardPreviewRoute.loggerConfig = { rosId: RosTeams.Analytics };

export default CustomDashboardPreviewRoute;

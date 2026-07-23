import { useCallback } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { analyticsCustomDashboardsManageNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import DashboardViewPage from '@modules/experience-analytics/custom-dashboards/pages/view/DashboardViewPage';
import CustomDashboardsShell from '@modules/experience-analytics/custom-dashboards/shell/CustomDashboardsShell';

const CustomDashboardViewRoute: NextLayoutPage = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const dashboardIdParam = router.query.dashboardId;
  const dashboardId = typeof dashboardIdParam === 'string' ? dashboardIdParam : undefined;

  const handleBackToManage = useCallback(() => {
    const experienceId = router.query.id;
    if (!experienceId || Array.isArray(experienceId)) {
      return;
    }
    void router.push(`/dashboard/creations/experiences/${experienceId}/analytics/dashboards`);
  }, [router]);

  const handleEditDashboard = useCallback(
    (nextDashboardId: string) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId)) {
        return;
      }
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${nextDashboardId}/edit`,
      );
    },
    [router],
  );

  return (
    <CustomDashboardsShell>
      <DashboardViewPage
        universeId={universeId}
        dashboardId={dashboardId}
        onBackToManage={handleBackToManage}
        onEditDashboard={handleEditDashboard}
      />
    </CustomDashboardsShell>
  );
};

CustomDashboardViewRoute.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCustomDashboardsManageNavigationItem,
    omitPageTitle: true,
  });
CustomDashboardViewRoute.loggerConfig = { rosId: RosTeams.Analytics };

export default CustomDashboardViewRoute;

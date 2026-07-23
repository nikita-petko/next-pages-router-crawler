import { type FC, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import CustomDashboardsShell from '../../shell/CustomDashboardsShell';
import type { CustomDashboardListItem } from '../../types';
import {
  type EditorWorkingCopy,
  NEW_DASHBOARD_ROUTE_ID,
} from '../../workingCopy/editorWorkingCopy';
import ManagePageContent from './ManagePageContent';

/**
 * Route component for `/analytics/dashboards`. Wraps the manage page content
 * in the shell (flag gate + service provider + cross-tab subscription) and
 * owns navigation routing for row-tap, edit, and post-create flows.
 */
const ManageAllDashboardsPage: FC = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();

  const navigateToDashboard = useCallback(
    (dashboardId: string, mode: 'view' | 'edit') => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId)) {
        return;
      }
      const suffix = mode === 'edit' ? '/edit' : '';
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${dashboardId}${suffix}`,
      );
    },
    [router],
  );

  const handleOpen = useCallback(
    (dashboard: CustomDashboardListItem) => {
      navigateToDashboard(dashboard.id, 'view');
    },
    [navigateToDashboard],
  );

  const handleEdit = useCallback(
    (dashboard: CustomDashboardListItem) => {
      navigateToDashboard(dashboard.id, 'edit');
    },
    [navigateToDashboard],
  );

  const handleDashboardCreated = useCallback(
    (workingCopy: EditorWorkingCopy) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId)) {
        return;
      }
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${NEW_DASHBOARD_ROUTE_ID}/edit?draftId=${workingCopy.draftId}`,
      );
    },
    [router],
  );

  return (
    <CustomDashboardsShell>
      <ManagePageContent
        universeId={universeId}
        onOpenDashboard={handleOpen}
        onEditDashboard={handleEdit}
        onDashboardCreated={handleDashboardCreated}
      />
    </CustomDashboardsShell>
  );
};

export default ManageAllDashboardsPage;

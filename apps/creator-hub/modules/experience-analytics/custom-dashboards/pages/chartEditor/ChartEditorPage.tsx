import { type FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import {
  isClientScriptCpuTimeEnabled as isClientScriptCPUTimeEnabledFlag,
  isRotraceMetricEnabled as isRotraceMetricEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { isHomeAcquisitionSignalsEnabled as isHomeAcquisitionSignalsEnabledFlag } from '@generated/flags/gameDiscoveryServing';
import getEnabledChartConfiguratorMetrics from '@modules/experience-analytics-shared/chartConfigurator/getEnabledChartConfiguratorMetrics';
import { customEventsMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import CustomDashboardsShell from '../../shell/CustomDashboardsShell';
import ChartEditorPageContainer from './ChartEditorPageContainer';
import ChartEditorPageContent from './ChartEditorPageContent';

/**
 * Chart-editor sub-route: configure a single chart tile (metric, breakdown,
 * chart type, time interval) with a live preview, then save back to the layout editor.
 */
const ChartEditorPage: FC = () => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const dashboardIdParam = router.query.dashboardId;
  const tileIdParam = router.query.tileId;
  const draftIdParam = router.query.draftId;
  const dashboardId = typeof dashboardIdParam === 'string' ? dashboardIdParam : undefined;
  const tileId = typeof tileIdParam === 'string' ? tileIdParam : undefined;
  const draftId = typeof draftIdParam === 'string' ? draftIdParam : undefined;

  const { ready: isClientScriptCPUTimeReady, value: isClientScriptCPUTimeEnabledValue } = useFlag(
    isClientScriptCPUTimeEnabledFlag,
  );
  const { ready: isRotraceMetricReady, value: isRotraceMetricEnabledValue } = useFlag(
    isRotraceMetricEnabledFlag,
    {
      universeId,
    },
  );
  const isClientScriptCPUTimeEnabled =
    isClientScriptCPUTimeReady && isClientScriptCPUTimeEnabledValue;
  const isRotraceMetricEnabled = isRotraceMetricReady && isRotraceMetricEnabledValue;
  const { ready: isHomeAcquisitionSignalsReady, value: isHomeAcquisitionSignalsEnabledValue } =
    useFlag(isHomeAcquisitionSignalsEnabledFlag, {
      universeId,
    });
  const isHomeAcquisitionSignalsEnabled =
    isHomeAcquisitionSignalsReady && isHomeAcquisitionSignalsEnabledValue;

  const allowedMetrics = useMemo(() => {
    const metrics = getEnabledChartConfiguratorMetrics({
      isClientScriptCPUTimeEnabled,
      isRotraceMetricEnabled,
      isHomeAcquisitionSignalsEnabled,
    });
    if (!metrics.includes(customEventsMetric)) {
      return [...metrics, customEventsMetric];
    }
    return metrics;
  }, [isClientScriptCPUTimeEnabled, isRotraceMetricEnabled, isHomeAcquisitionSignalsEnabled]);

  const handleBackToEditor = useCallback(
    (nextDraftId?: string) => {
      const experienceId = router.query.id;
      if (!experienceId || Array.isArray(experienceId) || !dashboardId) {
        return;
      }
      const resolvedDraftId = nextDraftId ?? draftId;
      const query = resolvedDraftId ? `?draftId=${resolvedDraftId}` : '';
      void router.push(
        `/dashboard/creations/experiences/${experienceId}/analytics/dashboards/${dashboardId}/edit${query}`,
      );
    },
    [dashboardId, draftId, router],
  );

  if (!dashboardId) {
    return null;
  }

  return (
    <CustomDashboardsShell>
      <ChartEditorPageContainer>
        <ChartEditorPageContent
          universeId={universeId}
          dashboardId={dashboardId}
          draftId={draftId}
          tileIdParam={tileId}
          allowedMetrics={allowedMetrics}
          onBackToEditor={handleBackToEditor}
        />
      </ChartEditorPageContainer>
    </CustomDashboardsShell>
  );
};

export default ChartEditorPage;

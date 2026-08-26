import { useMemo } from 'react';
import { useAnalyticsExperiencePermissions } from '../hooks/useAnalyticsPermissions';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';
import {
  getChartConfiguratorMetricOptionStates,
  type ChartConfiguratorMetricOptionState,
  type ChartConfiguratorPerformanceAccess,
} from './getChartConfiguratorMetricOptionState';

const useChartConfiguratorMetricOptionState = (
  metrics: readonly TChartConfiguratorMetrics[],
): ReadonlyMap<TChartConfiguratorMetrics, ChartConfiguratorMetricOptionState> => {
  const { id: universeId } = useUniverseResource();
  const { experienceHasPerformanceMonitoringAccess, isPending, isError } =
    useAnalyticsExperiencePermissions(universeId);

  const performanceAccess: ChartConfiguratorPerformanceAccess =
    isPending || isError
      ? 'unknown'
      : experienceHasPerformanceMonitoringAccess
        ? 'eligible'
        : 'ineligible';

  return useMemo(
    () => getChartConfiguratorMetricOptionStates(metrics, { performanceAccess }),
    [metrics, performanceAccess],
  );
};

export default useChartConfiguratorMetricOptionState;

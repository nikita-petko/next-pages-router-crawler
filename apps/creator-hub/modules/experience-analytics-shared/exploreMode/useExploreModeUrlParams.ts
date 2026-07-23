import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { AnalyticsSearchParams } from '@modules/charts-generic';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import {
  getFirstMetricFromPredefinedChart,
  getChartTypeFromPredefinedChart,
  ChartConfigOrPredefinedKey,
} from '../constants/RAQIV2PredefinedChartConfig';
import getEnabledExploreModeMetrics from './getEnabledExploreModeMetrics';
import { getExploreModeDimensions } from './ExploreModeDimensions';
import getExploreModeUrlParams from './getExploreModeUrlParams';
import useCurrentChartContext from './useCurrentChartContext';
import { useExperienceAnalyticsCurrentAnnotationsBundle } from '../context/ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import { isExploreModeSupportedChartType } from './ExploreModeChartTypes';

const useExploreModeUrlParams = (
  preset: ChartConfigOrPredefinedKey | null,
  chartContextOverride?: RAQIV2ChartContext,
): AnalyticsSearchParams | null => {
  const {
    exploreModeDateRangeFromChartContextEnabled,
    isClientScriptCPUTimeEnabled,
    isRotraceMetricEnabled,
    isDeepPlayEnabled,
    isNewRFYSignalsEnabled,
    isExploreModeComputedMetricsEnabled,
    isFetched,
  } = useFeatureFlagsForNamespace(
    [
      'exploreModeDateRangeFromChartContextEnabled',
      'isClientScriptCPUTimeEnabled',
      'isRotraceMetricEnabled',
      'isDeepPlayEnabled',
      'isNewRFYSignalsEnabled',
      'isExploreModeComputedMetricsEnabled',
    ],
    FeatureFlagNamespace.Analytics,
  );
  const allowedMetrics = useMemo(
    () =>
      getEnabledExploreModeMetrics({
        isClientScriptCPUTimeEnabled,
        isRotraceMetricEnabled,
        isDeepPlayEnabled,
        isNewRFYSignalsEnabled,
      }),
    [
      isClientScriptCPUTimeEnabled,
      isRotraceMetricEnabled,
      isDeepPlayEnabled,
      isNewRFYSignalsEnabled,
    ],
  );
  const metric = useMemo(() => {
    if (!preset) return null;

    const presetMetric = getFirstMetricFromPredefinedChart(preset);
    if (isValidArrayEnumValue(allowedMetrics, presetMetric)) {
      return presetMetric;
    }

    return null;
  }, [allowedMetrics, preset]);

  const chartType = useMemo(
    () => (preset ? getChartTypeFromPredefinedChart(preset, chartContextOverride) : null),
    [chartContextOverride, preset],
  );

  const { selectedAnnotationOptions: annotations } =
    useExperienceAnalyticsCurrentAnnotationsBundle();

  const dimensions = useMemo(() => {
    if (!metric) return [];
    const exploreModeDimensions = getExploreModeDimensions();
    return exploreModeDimensions?.[metric] || [];
  }, [metric]);

  const resource = useUniverseResource();
  const chartContext = useCurrentChartContext({
    resource,
    dimensions,
    metric,
    chartContextOverride,
  });
  const router = useRouter();

  return useMemo(() => {
    return preset && metric && chartType && isExploreModeSupportedChartType(chartType)
      ? getExploreModeUrlParams({
          preset,
          chartContext,
          annotationOptions: annotations,
          routerForReferrerParam: router,
          useDateRangeFromChartSpec: exploreModeDateRangeFromChartContextEnabled,
          enableComputedMetrics: isFetched && isExploreModeComputedMetricsEnabled,
        })
      : null;
  }, [
    annotations,
    chartContext,
    chartType,
    exploreModeDateRangeFromChartContextEnabled,
    isFetched,
    isExploreModeComputedMetricsEnabled,
    metric,
    preset,
    router,
  ]);
};
export default useExploreModeUrlParams;

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import {
  isClientScriptCpuTimeEnabled as isClientScriptCPUTimeEnabledFlag,
  isRotraceMetricEnabled as isRotraceMetricEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { isHomeAcquisitionSignalsEnabled as isHomeAcquisitionSignalsEnabledFlag } from '@generated/flags/gameDiscoveryServing';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { AnalyticsSearchParams } from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { AnnotationType } from '@modules/clients/analytics';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { isChartConfiguratorSupportedChartType } from '../chartConfigurator/ChartConfiguratorChartTypes';
import { getChartConfiguratorDimensions } from '../chartConfigurator/ChartConfiguratorDimensions';
import getEnabledExploreModeMetrics from '../chartConfigurator/getEnabledChartConfiguratorMetrics';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import {
  getFirstMetricFromPredefinedChart,
  getChartTypeFromPredefinedChart,
} from '../constants/RAQIV2PredefinedChartConfig';
import { useExperienceAnalyticsCurrentAnnotationsBundle } from '../context/ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import getExploreModeUrlParams from './getExploreModeUrlParams';
import useCurrentChartContext from './useCurrentChartContext';

const useExploreModeUrlParams = (
  preset: ChartConfigOrPredefinedKey | null,
  chartContextOverride?: RAQIV2ChartContext,
  /**
   * The chart's currently-visible annotations (i.e. the post-filter set
   * actually rendered on the chart). When the user navigates to Explore
   * Mode from this chart, every visible `ConfiguredAlertIncident`'s
   * `alertId` is forwarded as `?annotation_alertId=...` (repeated query
   * param) so Explore Mode opens with the same alerts pre-pinned in its
   * `Alerts` cascading sub-menu.
   */
  visibleTimeSeriesAnnotations?: readonly TimeSeriesAnnotation[],
): AnalyticsSearchParams | null => {
  const resource = useUniverseResource();
  const { ready: isClientScriptCPUTimeReady, value: isClientScriptCPUTimeEnabledValue } = useFlag(
    isClientScriptCPUTimeEnabledFlag,
  );
  const { ready: isRotraceMetricReady, value: isRotraceMetricEnabledValue } = useFlag(
    isRotraceMetricEnabledFlag,
    {
      universeId: resource.id ?? 0,
    },
  );
  const { ready: isHomeAcquisitionSignalsReady, value: isHomeAcquisitionSignalsEnabledValue } =
    useFlag(isHomeAcquisitionSignalsEnabledFlag, { universeId: resource.id });
  const isClientScriptCPUTimeEnabled =
    isClientScriptCPUTimeReady && isClientScriptCPUTimeEnabledValue;
  const isRotraceMetricEnabled = isRotraceMetricReady && isRotraceMetricEnabledValue;
  const isHomeAcquisitionSignalsEnabled =
    isHomeAcquisitionSignalsReady && isHomeAcquisitionSignalsEnabledValue;
  const allowedMetrics = useMemo(
    () =>
      getEnabledExploreModeMetrics({
        isClientScriptCPUTimeEnabled,
        isRotraceMetricEnabled,
        isHomeAcquisitionSignalsEnabled,
      }),
    [isClientScriptCPUTimeEnabled, isRotraceMetricEnabled, isHomeAcquisitionSignalsEnabled],
  );
  const featureFlagsFetched =
    isClientScriptCPUTimeReady && isRotraceMetricReady && isHomeAcquisitionSignalsReady;

  const metric = useMemo(() => {
    if (!preset || !featureFlagsFetched) {
      return null;
    }

    const presetMetric = getFirstMetricFromPredefinedChart(preset);
    if (isValidArrayEnumValue(allowedMetrics, presetMetric)) {
      return presetMetric;
    }

    return null;
  }, [allowedMetrics, featureFlagsFetched, preset]);

  const chartType = useMemo(
    () => (preset ? getChartTypeFromPredefinedChart(preset, chartContextOverride) : null),
    [chartContextOverride, preset],
  );

  const { selectedAnnotationOptions: annotations } =
    useExperienceAnalyticsCurrentAnnotationsBundle();

  const dimensions = useMemo(() => {
    if (!metric) {
      return [];
    }
    const chartConfiguratorDimensions = getChartConfiguratorDimensions();
    return chartConfiguratorDimensions?.[metric] || [];
  }, [metric]);

  const chartContext = useCurrentChartContext({
    resource,
    dimensions,
    metric,
    chartContextOverride,
  });
  const router = useRouter();

  // Project the chart's visible annotations to the alert ids the Explore
  // Mode `Alerts` sub-menu should pre-pin. Stable empty array preserves
  // memo identity when the chart has no visible alert incidents (the most
  // common case) so the outer memo doesn't churn.
  const alertIdsToPreselect = useMemo<readonly string[]>(() => {
    if (!visibleTimeSeriesAnnotations || visibleTimeSeriesAnnotations.length === 0) {
      return [];
    }
    const ids: string[] = [];
    visibleTimeSeriesAnnotations.forEach((annotation) => {
      if (annotation.type === AnnotationType.ConfiguredAlertIncident) {
        ids.push(annotation.alertId);
      }
    });
    return ids;
  }, [visibleTimeSeriesAnnotations]);

  return useMemo(() => {
    return preset && metric && chartType && isChartConfiguratorSupportedChartType(chartType)
      ? getExploreModeUrlParams({
          preset,
          chartContext,
          annotationOptions: annotations,
          routerForReferrerParam: router,
          alertIdsToPreselect,
        })
      : null;
  }, [annotations, chartContext, chartType, metric, preset, router, alertIdsToPreselect]);
};
export default useExploreModeUrlParams;

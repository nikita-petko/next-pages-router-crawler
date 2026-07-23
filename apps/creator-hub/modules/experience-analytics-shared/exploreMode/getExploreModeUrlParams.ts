import type { NextRouter } from 'next/router';
import {
  RAQIV2DateRangeType,
  type RAQIV2MetricGranularity,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import type { AnalyticsSearchParams } from '@modules/charts-generic/utils/analyticsUrlBuilder';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics';
import { isValidArrayEnumValue, isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { raqiV2FiltersToLegacy } from '../adapters/legacyFiltersToRAQIV2';
import { isChartConfiguratorSupportedChartType } from '../chartConfigurator/ChartConfiguratorChartTypes';
import { isChartConfiguratorMetric } from '../chartConfigurator/chartConfiguratorMetricsConfig';
import {
  serializeOverlayParam,
  serializeBenchmarkType,
  serializeComparisonOffset,
  serializeComparisonCustomStartDate,
} from '../chartConfigurator/overlayUrlParams';
import getMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import type { AnnotationOptions } from '../constants/annotationConfig';
import { getAnnotationTypesFromAnnotationOptions } from '../constants/annotationConfig';
import { raqiSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import {
  getMetricRelatedConfigFromPredefinedChart,
  getOverlays,
  getNonMetricRelatedConfigFromPredefinedChart,
  getChartTypeFromPredefinedChart,
  getPredefinedChartKey,
} from '../constants/RAQIV2PredefinedChartConfig';
import { uiGranularityToQueryGranularity } from '../context/AnalyticsCurrentGranularityProvider';
import { mergeUIFiltersIntoQueryParams } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { isComputedMetric } from '../types/ComputedMetric';
import { serializeComputedMetricToQueryParam } from '../types/ComputedMetricQueryParam';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import type { ChartOverlays } from '../types/RAQIV2ChartSpec';
import { getOverlay } from '../types/RAQIV2ChartSpec';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import computeRAQIV2SpecOverride from '../utils/computeRAQIV2SpecOverride';
import getOverlayAvailability from '../utils/getOverlayAvailability';
import { getQuotaConfigForMetric } from '../utils/getQuotaConfigForMetric';
import { getRAQIV2BenchmarkMetricFromMetricLike } from '../utils/metricLikeSemantics';
import { UIGranularities } from '../utils/seriesGranularities';

// Time window lives under `timeSpec` to match `RAQIV2ChartContext` /
// `RAQIV2ChartSpec`; reading it from the top level silently falls through to
// the metric default.
type TExploreModeChartContext = {
  granularity: RAQIV2MetricGranularity;
  breakdown?: readonly TRAQIV2Dimension[];
  filter?: readonly RAQIV2QueryFilter[];
  timeSpec?: TExplicitTimeRangeSpec;
} & Partial<Pick<RAQIV2ChartSpec, 'resource' | 'timeAxisBounds' | 'benchmarkPercentiles'>>;

const getTimeRangeQueryParamsFromTimeSpec = (
  timeSpec: TExplicitTimeRangeSpec | undefined,
): Partial<AnalyticsSearchParams> | null => {
  if (!timeSpec) {
    return null;
  }
  // Relative preset on the origin (e.g. Last7Days): pass it through so
  // Explore Mode shows the same picker selection and stays auto-rolling
  // instead of snapshotting the resolved window into a fixed Custom range.
  if (timeSpec.rangeType && timeSpec.rangeType !== RAQIV2DateRangeType.Custom) {
    return { [AnalyticsQueryParams.RangeType]: timeSpec.rangeType };
  }
  return {
    [AnalyticsQueryParams.RangeType]: RAQIV2DateRangeType.Custom,
    [AnalyticsQueryParams.MinTime]: timeSpec.startTime.getTime().toString(),
    [AnalyticsQueryParams.MaxTime]: timeSpec.endTime.getTime().toString(),
  };
};

const getTimeRangeQueryParams = (
  metric: TRAQIV2NumericUIMetric,
  chartContext: TExploreModeChartContext,
): Partial<AnalyticsSearchParams> => {
  if (!isChartConfiguratorMetric(metric)) {
    return {};
  }

  const fromTimeSpec = getTimeRangeQueryParamsFromTimeSpec(chartContext.timeSpec);
  if (fromTimeSpec) {
    return fromTimeSpec;
  }

  // TODO(gperkins@20240708): DSA-2650 -- Add date range override to chartSpec, generalize this
  const exploreModeConfig = getMetricDisplayConfig(metric).exploreMode;
  // Skip the param entirely when there's no default to avoid serializing
  // `rangeType=undefined` (URLSearchParams stringifies undefined values).
  if (!exploreModeConfig || exploreModeConfig.disabled || !exploreModeConfig.defaultDateRangeType) {
    return {};
  }
  return {
    [AnalyticsQueryParams.RangeType]: exploreModeConfig.defaultDateRangeType,
  };
};

/**
 * Serializes the chart-context fields shared by every analytics deep link
 * (atomic metric, granularity, breakdown, filters) into query params.
 *
 * This is the single source of truth for those param names/encoding so that
 * Explore Mode and the create-alert deep link can never drift apart — rename a
 * key (or change the filter/granularity encoding) here and both follow. Reused
 * by `getExploreModeUrlParams` below and by the create-alert deep link
 * (`useCreateAlertUrlParams`).
 *
 * `metric` is the atomic metric only (computed metrics are serialized
 * separately by Explore Mode and aren't supported by alerts); pass `null` to
 * omit the metric param.
 */
export const getSharedChartContextQueryParams = ({
  metric,
  granularity,
  breakdown = [],
  filter = [],
}: {
  metric: TRAQIV2NumericUIMetric | null;
  granularity?: RAQIV2MetricGranularity;
  breakdown?: readonly TRAQIV2Dimension[];
  filter?: readonly RAQIV2QueryFilter[];
}): AnalyticsSearchParams => {
  // Omit the granularity param when the chart's granularity has no UI-enum
  // mapping so we never serialize `granularity=undefined`.
  const granularityParam: Partial<AnalyticsSearchParams> =
    granularity != null && isValidArrayEnumValue(UIGranularities, granularity)
      ? { [AnalyticsQueryParams.Granularity]: uiGranularityToQueryGranularity[granularity] }
      : {};

  const filterQueryParams = mergeUIFiltersIntoQueryParams(
    raqiV2FiltersToLegacy(filter),
    {},
    raqiSupportedFilterBarDimensions,
  );

  return {
    ...(metric ? { [AnalyticsQueryParams.Metric]: metric } : {}),
    ...granularityParam,
    [AnalyticsQueryParams.Breakdown]: [...breakdown],
    ...filterQueryParams,
  };
};

const getExploreModeUrlParams = ({
  preset,
  chartContext,
  annotationOptions,
  routerForReferrerParam,
  overlays,
  alertIdsToPreselect,
}: {
  preset: ChartConfigOrPredefinedKey;
  chartContext: TExploreModeChartContext;
  annotationOptions: AnnotationOptions[] | null;
  routerForReferrerParam?: NextRouter;
  overlays?: ChartOverlays;
  /**
   * Alert ids the navigating chart is currently rendering as
   * `ConfiguredAlertIncident` annotations (post per-chart-context filter).
   * Forwarded as `?annotation_alertId=...` (repeated query param) so
   * Explore Mode opens with the same sub-set pre-selected in its
   * `Alerts` cascading sub-menu.
   */
  alertIdsToPreselect?: readonly string[];
}): AnalyticsSearchParams => {
  const [{ metric, overrides: predefinedChartSpecOverride }] =
    getMetricRelatedConfigFromPredefinedChart(preset);
  const atomicMetric = isComputedMetric(metric) ? null : metric;

  const effectiveOverlays =
    overlays ?? getOverlays(getNonMetricRelatedConfigFromPredefinedChart(preset));

  const spec = computeRAQIV2SpecOverride(chartContext, predefinedChartSpecOverride);

  const { granularity: raqiGranularity, filter: raqiFilter = [], breakdown } = spec;

  // Metric/granularity/breakdown/filter share their encoding with the
  // create-alert deep link; computed metric, preset, overlays, time range, and
  // annotations below are Explore-Mode-only and layered on top.
  const sharedContextParams = getSharedChartContextQueryParams({
    metric: atomicMetric,
    granularity: raqiGranularity,
    breakdown,
    filter: raqiFilter,
  });

  let timeRangeQueryParams: Partial<AnalyticsSearchParams> = {};
  if (isComputedMetric(metric)) {
    timeRangeQueryParams = getTimeRangeQueryParamsFromTimeSpec(chartContext.timeSpec) ?? {};
  } else if (atomicMetric) {
    timeRangeQueryParams = getTimeRangeQueryParams(atomicMetric, chartContext);
  }

  const resolvedPreset = getPredefinedChartKey(preset);
  const presetParams = resolvedPreset ? { [AnalyticsQueryParams.Preset]: resolvedPreset } : {};

  const computedMetricParams: Partial<AnalyticsSearchParams> = {};
  if (isComputedMetric(metric)) {
    const serializedComputedMetric = serializeComputedMetricToQueryParam(metric);
    if (serializedComputedMetric) {
      computedMetricParams[AnalyticsQueryParams.ComputedMetric] = serializedComputedMetric;
    }
  }

  const result: AnalyticsSearchParams = {
    ...presetParams,
    ...computedMetricParams,
    ...sharedContextParams,
    [AnalyticsQueryParams.FilterAnnotation]: getAnnotationTypesFromAnnotationOptions(
      annotationOptions ?? [],
    )?.filter((x) => isValidEnumValue(AnnotationType, x)),
    ...timeRangeQueryParams,
  };

  if (routerForReferrerParam) {
    const currentUri = routerForReferrerParam.asPath;
    const analyticsReferrer = btoa(currentUri);
    result[AnalyticsQueryParams.Referrer] = analyticsReferrer;
  }

  // De-dupe but preserve the caller-supplied order so the Explore-Mode
  // URL stays stable when the originating chart already orders its
  // visible alerts deterministically (e.g. by severity).
  if (alertIdsToPreselect && alertIdsToPreselect.length > 0) {
    const deduped = Array.from(new Set(alertIdsToPreselect.filter((id) => id.length > 0)));
    if (deduped.length > 0) {
      result[AnalyticsQueryParams.AlertIds] = deduped;
    }
  }

  // `getQuotaConfigForMetric` already short-circuits to `undefined` when the
  // metric has no quota_config or when the companion isn't a numeric UI metric
  // we can chart, so a presence check is enough here.
  const metricHasQuota =
    atomicMetric !== null && getQuotaConfigForMetric(atomicMetric) !== undefined;

  if (metricHasQuota) {
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('quota');
  } else if (effectiveOverlays?.length) {
    const firstOverlay = effectiveOverlays[0];
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam(firstOverlay.type);
    const benchmarkOverlay = getOverlay(effectiveOverlays, 'benchmark');
    if (benchmarkOverlay?.benchmarkType) {
      result[AnalyticsQueryParams.OverlayBenchmarkType] =
        serializeBenchmarkType(benchmarkOverlay.benchmarkType ?? null) ?? undefined;
    }
    const comparisonOverlay = getOverlay(effectiveOverlays, 'comparison');
    if (comparisonOverlay?.relativeOffset) {
      result[AnalyticsQueryParams.OverlayComparisonOffset] =
        serializeComparisonOffset(comparisonOverlay.relativeOffset) ?? undefined;
    }
    if (comparisonOverlay?.customStartDate) {
      result[AnalyticsQueryParams.OverlayComparisonCustomStartTime] =
        serializeComparisonCustomStartDate(comparisonOverlay.customStartDate) ?? undefined;
    }
  } else if (effectiveOverlays !== undefined) {
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('none');
  } else if (atomicMetric && chartContext.resource && chartContext.timeSpec) {
    const resolvedChartContext: RAQIV2ChartContext = {
      ...chartContext,
      ...spec,
      resource: chartContext.resource,
      timeSpec: chartContext.timeSpec,
      timeAxisBounds: chartContext.timeAxisBounds ?? null,
    };
    const chartType = getChartTypeFromPredefinedChart(preset, resolvedChartContext);
    const supportedChartType = isChartConfiguratorSupportedChartType(chartType)
      ? chartType
      : undefined;
    const overlayAvailability = getOverlayAvailability(
      {
        ...resolvedChartContext,
        metric: atomicMetric,
      },
      {
        isComputedMetric: false,
        hasBreakdown: !!breakdown?.length,
        chartType: supportedChartType,
        hasQuota: metricHasQuota,
      },
    );

    if (overlayAvailability.benchmark.applicable && !overlayAvailability.benchmark.disabled) {
      // Charts without explicit overlays default to showing benchmarks when
      // the resolved chart context can actually render a benchmark.
      result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('benchmark');
    } else if (
      overlayAvailability.comparison.applicable &&
      !overlayAvailability.comparison.disabled
    ) {
      result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('comparison');
    }
  } else if (getRAQIV2BenchmarkMetricFromMetricLike(metric)) {
    // Partial callers do not provide enough context to determine contextual
    // benchmark availability. Preserve the historical benchmark deep-link
    // default for those callers.
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('benchmark');
  }

  return result;
};
export default getExploreModeUrlParams;

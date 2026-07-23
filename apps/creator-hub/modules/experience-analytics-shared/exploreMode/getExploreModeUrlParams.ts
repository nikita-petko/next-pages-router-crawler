import { NextRouter } from 'next/router';

import {
  AnalyticsQueryParams,
  AnalyticsSearchParams,
  DateRangeType,
} from '@modules/charts-generic';

import {
  isValidArrayEnumValue,
  isValidEnumValue,
} from '@modules/miscellaneous/common/utils/enumUtils';
import { AnnotationType, RAQIV2QueryFilter } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import {
  ChartConfigOrPredefinedKey,
  getMetricRelatedConfigFromPredefinedChart,
  getOverlays,
  getNonMetricRelatedConfigFromPredefinedChart,
  getPredefinedChartKey,
} from '../constants/RAQIV2PredefinedChartConfig';
import computeRAQIV2SpecOverride from '../utils/computeRAQIV2SpecOverride';
import { raqiV2FiltersToLegacy } from '../adapters/legacyFiltersToRAQIV2';
import { mergeUIFiltersIntoQueryParams } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { UIGranularities } from '../utils/seriesGranularities';
import {
  QueryParamGranularity,
  uiGranularityToQueryGranularity,
} from '../context/AnalyticsCurrentGranularityProvider';
import {
  AnnotationOptions,
  getAnnotationTypesFromAnnotationOptions,
} from '../constants/annotationConfig';
import { isExploreModeMetric } from './exploreModeMetricsConfig';
import { raqiSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import getMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import { isComputedMetric } from '../types/ComputedMetric';
import { serializeComputedMetricToQueryParam } from '../types/ComputedMetricQueryParam';
import type { ChartOverlays } from '../types/RAQIV2ChartSpec';
import { serializeOverlayParam, serializeBenchmarkType } from './overlayUrlParams';
import { getOverlay } from '../types/RAQIV2ChartSpec';
import { getRAQIV2BenchmarkMetricFromMetricLike } from '../utils/metricLikeSemantics';

type TExploreModeChartContext = {
  granularity: RAQIV2MetricGranularity;
  breakdown?: readonly TRAQIV2Dimension[];
  filter?: readonly RAQIV2QueryFilter[];
  startTime?: Date;
  endTime?: Date;
};

const getTimeRangeQueryParams = (
  metric: TRAQIV2NumericUIMetric,
  chartContext: TExploreModeChartContext,
  useDateRangeFromChartSpec: boolean,
): Partial<AnalyticsSearchParams> => {
  if (!isExploreModeMetric(metric)) return {};

  const { startTime, endTime } = chartContext;
  if (useDateRangeFromChartSpec && startTime && endTime) {
    return {
      [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
      [AnalyticsQueryParams.MinTime]: startTime.getTime().toString(),
      [AnalyticsQueryParams.MaxTime]: endTime.getTime().toString(),
    };
  }

  // TODO(gperkins@20240708): DSA-2650 -- Add date range override to chartSpec, generalize this
  const exploreModeConfig = getMetricDisplayConfig(metric).exploreMode;
  return exploreModeConfig && !exploreModeConfig.disabled
    ? {
        [AnalyticsQueryParams.RangeType]: exploreModeConfig.defaultDateRangeType,
      }
    : {};
};

const getExploreModeUrlParams = ({
  preset,
  chartContext,
  annotationOptions,
  routerForReferrerParam,
  useDateRangeFromChartSpec = true,
  enableComputedMetrics = false,
  overlays,
}: {
  preset: ChartConfigOrPredefinedKey;
  chartContext: TExploreModeChartContext;
  annotationOptions: AnnotationOptions[] | null;
  routerForReferrerParam?: NextRouter;
  useDateRangeFromChartSpec?: boolean;
  enableComputedMetrics?: boolean;
  overlays?: ChartOverlays;
}): AnalyticsSearchParams => {
  const [{ metric, overrides: predefinedChartSpecOverride }] =
    getMetricRelatedConfigFromPredefinedChart(preset);
  const atomicMetric = isComputedMetric(metric) ? null : metric;

  const effectiveOverlays =
    overlays ?? getOverlays(getNonMetricRelatedConfigFromPredefinedChart(preset));

  const spec = computeRAQIV2SpecOverride(chartContext, predefinedChartSpecOverride);

  const { granularity: raqiGranularity, filter: raqiFilter = [], breakdown } = spec;

  const granularity: QueryParamGranularity | undefined = isValidArrayEnumValue(
    UIGranularities,
    raqiGranularity,
  )
    ? uiGranularityToQueryGranularity[raqiGranularity]
    : undefined;

  const legacyUIFilters = raqiV2FiltersToLegacy(raqiFilter);
  const filterQueryParams = mergeUIFiltersIntoQueryParams(
    legacyUIFilters,
    {},
    raqiSupportedFilterBarDimensions,
  );

  let timeRangeQueryParams: Partial<AnalyticsSearchParams> = {};
  if (isComputedMetric(metric)) {
    const { startTime, endTime } = chartContext;
    if (useDateRangeFromChartSpec && startTime && endTime) {
      timeRangeQueryParams = {
        [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
        [AnalyticsQueryParams.MinTime]: startTime.getTime().toString(),
        [AnalyticsQueryParams.MaxTime]: endTime.getTime().toString(),
      };
    }
  } else if (atomicMetric) {
    timeRangeQueryParams = getTimeRangeQueryParams(
      atomicMetric,
      chartContext,
      useDateRangeFromChartSpec,
    );
  }

  const resolvedPreset = getPredefinedChartKey(preset);
  const presetParams = resolvedPreset ? { [AnalyticsQueryParams.Preset]: resolvedPreset } : {};

  const computedMetricParams: Partial<AnalyticsSearchParams> = {};
  if (enableComputedMetrics && isComputedMetric(metric)) {
    computedMetricParams[AnalyticsQueryParams.ComputedMetric] =
      serializeComputedMetricToQueryParam(metric);
  } else if (atomicMetric) {
    computedMetricParams[AnalyticsQueryParams.Metric] = atomicMetric;
  }

  const result: AnalyticsSearchParams = {
    ...presetParams,
    ...computedMetricParams,
    [AnalyticsQueryParams.Breakdown]: (breakdown ?? []) as string[],
    [AnalyticsQueryParams.Granularity]: granularity,
    [AnalyticsQueryParams.FilterAnnotation]: getAnnotationTypesFromAnnotationOptions(
      annotationOptions ?? [],
    )?.filter((x) => isValidEnumValue(AnnotationType, x)),
    ...filterQueryParams,
    ...timeRangeQueryParams,
  };

  if (routerForReferrerParam) {
    const currentUri = routerForReferrerParam.asPath;
    const analyticsReferrer = btoa(currentUri);
    result[AnalyticsQueryParams.Referrer] = analyticsReferrer;
  }

  if (effectiveOverlays?.length) {
    const firstOverlay = effectiveOverlays[0];
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam(firstOverlay.type);
    const benchmarkOverlay = getOverlay(effectiveOverlays, 'benchmark');
    if (benchmarkOverlay?.benchmarkType) {
      result[AnalyticsQueryParams.OverlayBenchmarkType] =
        serializeBenchmarkType(benchmarkOverlay.benchmarkType ?? null) ?? undefined;
    }
  } else if (effectiveOverlays !== undefined) {
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('none');
  } else if (getRAQIV2BenchmarkMetricFromMetricLike(metric)) {
    // Charts without explicit overlays default to showing benchmarks
    // (useResolvedOverlays returns benchmark.show=true when overlays is undefined).
    // Carry that implicit state forward so Explore Mode pre-selects benchmarks.
    result[AnalyticsQueryParams.Overlays] = serializeOverlayParam('benchmark');
  }

  return result;
};
export default getExploreModeUrlParams;

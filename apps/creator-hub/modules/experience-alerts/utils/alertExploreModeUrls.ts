import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams, {
  type AnalyticsSearchParams,
} from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { AnnotationType } from '@modules/clients/analytics';
import { raqiV2FiltersToLegacy } from '@modules/experience-analytics-shared/adapters/legacyFiltersToRAQIV2';
import getGranularityOptionsForMetric from '@modules/experience-analytics-shared/chartConfigurator/getGranularityOptionsForMetric';
import { getIntersectedExploreModeDateRangesForMetrics } from '@modules/experience-analytics-shared/chartConfigurator/resolveChartConfiguratorComputedMetricSources';
import { raqiSupportedFilterBarDimensions } from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import { uiGranularityToQueryGranularity } from '@modules/experience-analytics-shared/context/AnalyticsCurrentGranularityProvider';
import { getSharedChartContextQueryParams } from '@modules/experience-analytics-shared/exploreMode/getExploreModeUrlParams';
import { mergeUIFiltersIntoQueryParams } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import {
  PRESET_DATE_RANGE_DURATION_MS,
  PRESET_DATE_RANGE_DURATIONS_MS,
} from '@modules/experience-analytics-shared/utils/dateRangeUtils';
import {
  UIGranularities,
  getSeriesDefaultGranularity,
} from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type {
  AnalyticsAlertDetail,
  ExperienceAlertFormValues,
  TAlertConditionMetric,
} from '../constants/types';
import { resolveAlertFormBreakdownAndFilter } from './analyticsAlertFormToApiRequest';
import { metricGranularityFromAnalyticsInterval } from './analyticsAlertFormUtils';

/**
 * Preset → lookback window (the max elapsed-ms since `lastFiredAt` a preset's
 * start date covers). Aliased to {@link PRESET_DATE_RANGE_DURATIONS_MS} since a
 * preset's duration is exactly that lookback.
 */
const PRESET_RANGE_LOOKBACK_MS = PRESET_DATE_RANGE_DURATIONS_MS;

/**
 * Date range that renders the chosen granularity at a natural resolution —
 * enough data points to be meaningful without exceeding Explore Mode's
 * point-count cap (which would snap the chart up to a coarser granularity).
 * Keyed by the granularities an alert interval can map to
 * (`metricGranularityFromAnalyticsInterval`).
 */
const GRANULARITY_PREFERRED_DATE_RANGE: Partial<
  Record<RAQIV2MetricGranularity, RAQIV2DateRangeType>
> = {
  [RAQIV2MetricGranularity.OneMinute]: RAQIV2DateRangeType.Last1Hour,
  [RAQIV2MetricGranularity.HalfHour]: RAQIV2DateRangeType.Last1Day,
  [RAQIV2MetricGranularity.OneHour]: RAQIV2DateRangeType.Last7Days,
  [RAQIV2MetricGranularity.OneDay]: RAQIV2DateRangeType.Last28Days,
};

/**
 * Pick the tightest available preset range whose start date covers lastFiredAt.
 * Falls back to the largest available preset when nothing fits (for example,
 * when the alert fired before every supported preset window). Returns
 * undefined if no preset is available.
 */
const pickRangeTypeForLastFiredAt = (
  lastFiredAt: Date,
  availableRanges: readonly RAQIV2DateRangeType[],
): RAQIV2DateRangeType | undefined => {
  const elapsedMs = Date.now() - lastFiredAt.getTime();
  const availableSet = new Set(availableRanges);
  for (const [rangeType, lookbackMs] of PRESET_RANGE_LOOKBACK_MS) {
    if (availableSet.has(rangeType) && lookbackMs >= elapsedMs) {
      return rangeType;
    }
  }
  // Fallback: largest available preset
  for (let i = PRESET_RANGE_LOOKBACK_MS.length - 1; i >= 0; i--) {
    const entry = PRESET_RANGE_LOOKBACK_MS[i];
    if (entry && availableSet.has(entry[0])) {
      return entry[0];
    }
  }
  return undefined;
};

/**
 * Pick the Explore-Mode date-range preset that best surfaces `granularity`,
 * constrained to the ranges the metric supports (`availableRanges`, typically
 * from `getIntersectedExploreModeDateRangesForMetrics`).
 *
 * Prefers the granularity's natural range
 * ({@link GRANULARITY_PREFERRED_DATE_RANGE}) when supported; otherwise falls
 * back to the available preset whose duration is closest to that preferred
 * window (ties resolve to the tighter range). Returns `undefined` when no
 * mapping exists, no presets are available, or only `Custom` is supported, so
 * the caller can omit the range param and let Explore Mode use the metric
 * default.
 */
const pickExploreModeDateRangeForGranularity = (
  granularity: RAQIV2MetricGranularity,
  availableRanges: readonly RAQIV2DateRangeType[],
): RAQIV2DateRangeType | undefined => {
  const preferred = GRANULARITY_PREFERRED_DATE_RANGE[granularity];
  if (!preferred || availableRanges.length === 0) {
    return undefined;
  }
  if (availableRanges.includes(preferred)) {
    return preferred;
  }

  const targetMs = PRESET_DATE_RANGE_DURATION_MS[preferred];
  if (targetMs == null) {
    return undefined;
  }

  let best: { range: RAQIV2DateRangeType; durationMs: number } | undefined;
  for (const range of availableRanges) {
    const durationMs = PRESET_DATE_RANGE_DURATION_MS[range];
    if (durationMs == null) {
      // Skip Custom / any preset with no fixed duration.
      continue;
    }
    if (!best) {
      best = { range, durationMs };
      continue;
    }
    const delta = Math.abs(durationMs - targetMs);
    const bestDelta = Math.abs(best.durationMs - targetMs);
    if (delta < bestDelta || (delta === bestDelta && durationMs < best.durationMs)) {
      best = { range, durationMs };
    }
  }

  return best?.range;
};

/**
 * Whether `metric`'s `granularity` renders natively within the `rangeType`
 * preset's window. Defers to {@link getGranularityOptionsForMetric} — Explore
 * Mode's own metric-aware start-date × duration allow-list — so we never emit a
 * granularity Explore Mode would coerce to a coarser one. `true` when `rangeType`
 * is undefined, since there's no window to constrain against.
 */
const isGranularitySupportedByRangeType = (
  granularity: RAQIV2MetricGranularity,
  rangeType: RAQIV2DateRangeType | undefined,
  metric: TAlertConditionMetric,
): boolean => {
  if (!rangeType) {
    return true;
  }
  const lookbackEntry = PRESET_RANGE_LOOKBACK_MS.find(([rt]) => rt === rangeType);
  if (!lookbackEntry) {
    return true;
  }
  const now = new Date();
  const startDate = new Date(now.getTime() - lookbackEntry[1]);
  return getGranularityOptionsForMetric({ metric, startDate, endDate: now }).some(
    (option) => option.isAllowed && option.granularity === granularity,
  );
};

/** Alert-form fields the Explore-Mode deep link is derived from. */
export type AlertFormExploreModeInput = Pick<
  ExperienceAlertFormValues,
  'metric' | 'interval' | 'filters' | 'breakdownDimension' | 'breakdownCategories'
>;

/**
 * Builds an Explore-Mode deep link from an alert **form's** current selection
 * (metric, interval -> granularity, breakdown, filters) — i.e. the in-progress,
 * not-yet-saved alert a creator is editing. Reuses the same
 * `getSharedChartContextQueryParams` serializer the chart -> create-alert link
 * uses, so the metric/granularity/breakdown/filter param names stay in lockstep,
 * and the same `resolveAlertFormBreakdownAndFilter` conversion the create/update
 * API request uses, so breakdown categories fold into the breakdown-dimension
 * filter exactly as they do on submit.
 *
 * When an interval is chosen, the link also pins a date-range preset matching the
 * derived granularity (via {@link pickExploreModeDateRangeForGranularity}) so the
 * chart opens at a window where that granularity renders natively instead of
 * snapping to the metric's default range. The range param is omitted when no
 * interval is selected so Explore Mode falls back to the metric default.
 *
 * Returns `null` when no metric is selected so the caller can disable the
 * button.
 */
export const buildExploreModeUrlFromAlertForm = ({
  values,
  universeId,
}: {
  values: AlertFormExploreModeInput;
  universeId: number;
}): string | null => {
  const { metric, interval } = values;
  if (!metric) {
    return null;
  }

  // Omit granularity when no interval is chosen yet; the serializer drops it.
  const granularity: RAQIV2MetricGranularity | undefined = interval
    ? metricGranularityFromAnalyticsInterval(interval)
    : undefined;
  const { breakdown, filter } = resolveAlertFormBreakdownAndFilter(values);

  const params = getSharedChartContextQueryParams({
    metric,
    granularity,
    breakdown: breakdown ?? [],
    filter,
  });

  // Pick a date-range preset that shows the chosen granularity at a natural
  // resolution, constrained to the ranges the metric actually supports in
  // Explore Mode. Skipped entirely when no granularity (interval) is selected.
  // `pickExploreModeDateRangeForGranularity` never returns `Custom`, so the
  // serialized range is always a self-contained preset (no min/max time needed).
  const rangeType = granularity
    ? pickExploreModeDateRangeForGranularity(
        granularity,
        getIntersectedExploreModeDateRangesForMetrics([metric]),
      )
    : undefined;
  const rangeParam: Partial<AnalyticsSearchParams> = rangeType
    ? { [AnalyticsQueryParams.RangeType]: rangeType }
    : {};

  return buildExperienceAnalyticsUrlWithParams(
    analyticsExploreNavigationItem,
    { ...params, ...rangeParam },
    universeId,
  );
};

/**
 * Builds an Explore-Mode deep link from a **saved** alert's detail — i.e. an
 * existing, persisted alert being viewed from the alerts table / overview. The
 * link pre-populates the alert's metric, granularity, breakdown, and filters,
 * and (when the alert has fired) focuses the time range on when it fired via
 * {@link pickRangeTypeForLastFiredAt}, deriving a matching granularity from that
 * span. When the alert hasn't fired, the time range falls back to the metric's
 * standard explore-mode default. Overlays / computed metrics / annotations are
 * intentionally omitted (alerts don't carry a chart preset).
 *
 * Pass `referrer` as `btoa(router.asPath)` from the calling page so the
 * Explore Mode "Close" button navigates back to the originating page instead
 * of the experience overview fallback.
 *
 * NOTE: optional params (`granularity`, `rangeType`) are conditionally spread
 * because `URLSearchParams.append(key, undefined)` serializes the literal
 * string "undefined" and the explore page would interpret that as a value.
 */
export const buildExploreModeUrlFromAlertDetail = (
  alert: AnalyticsAlertDetail,
  referrer?: string,
): string => {
  const { universeId, metric, filter, breakdown, granularity, alertId } = alert;

  const filterQueryParams = mergeUIFiltersIntoQueryParams(
    raqiV2FiltersToLegacy(filter),
    {},
    raqiSupportedFilterBarDimensions,
  );

  const availableRanges = getIntersectedExploreModeDateRangesForMetrics([metric]);
  const rangeType = alert.lastFiredAt
    ? pickRangeTypeForLastFiredAt(alert.lastFiredAt, availableRanges)
    : undefined;
  const rangeParam: Partial<AnalyticsSearchParams> = rangeType
    ? { [AnalyticsQueryParams.RangeType]: rangeType }
    : {};

  const granularityParam: Partial<AnalyticsSearchParams> = (() => {
    // Prefer the alert's configured granularity, but only when the fired-at
    // window can render it natively.
    if (
      isValidArrayEnumValue(UIGranularities, granularity) &&
      isGranularitySupportedByRangeType(granularity, rangeType, metric)
    ) {
      return { [AnalyticsQueryParams.Granularity]: uiGranularityToQueryGranularity[granularity] };
    }
    if (rangeType) {
      const lookbackEntry = PRESET_RANGE_LOOKBACK_MS.find(([rt]) => rt === rangeType);
      if (lookbackEntry) {
        const now = new Date();
        const derivedGranularity = getSeriesDefaultGranularity(
          new Date(now.getTime() - lookbackEntry[1]),
          now,
        );
        return {
          [AnalyticsQueryParams.Granularity]: uiGranularityToQueryGranularity[derivedGranularity],
        };
      }
    }
    return {};
  })();

  const referrerParam: Partial<AnalyticsSearchParams> = referrer
    ? { [AnalyticsQueryParams.Referrer]: referrer }
    : {};

  const params: AnalyticsSearchParams = {
    [AnalyticsQueryParams.Metric]: metric,
    ...granularityParam,
    [AnalyticsQueryParams.Breakdown]: [...breakdown],
    ...filterQueryParams,
    ...rangeParam,
    ...referrerParam,
    [AnalyticsQueryParams.AlertIds]: alertId,
    [AnalyticsQueryParams.Annotation]: [AnnotationType.ConfiguredAlertIncident],
  };

  return buildExperienceAnalyticsUrlWithParams(analyticsExploreNavigationItem, params, universeId);
};

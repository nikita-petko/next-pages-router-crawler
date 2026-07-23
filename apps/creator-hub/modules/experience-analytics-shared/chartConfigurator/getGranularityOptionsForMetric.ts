import { startOfToday, subDays } from '@rbx/core';
import type { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedGranularities,
  RAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { getCurrentHourDate, subHours } from '@modules/charts-generic/utils/dateUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getRecordEntries } from '@modules/miscellaneous/utils/helperUtils';
import { isDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import type { GranularityConstraintRule } from '../types/RAQIV2PageConfig';
import isGranularityAllowedByConstraints from '../utils/isGranularityAllowedByConstraints';
import type { TUIGranularity } from '../utils/seriesGranularities';

// Categories based on the provided start date
enum StartDateCategory {
  WithinLastHour = 'withinLastHour',
  WithinLast1Day = 'withinLast1Day',
  WithinLast7Days = 'withinLast7Days',
  WithinLast28Days = 'withinLast28Days',
  WithinLast365Days = 'withinLast365Days',
  OneYearAgo = 'oneYearAgo',
}

// Categories based on the duration (end time - start time)
enum DurationCategory {
  LessThanOneHour = 'lessThanOneHour',
  LessThanOneDay = 'lessThanOneDay',
  LessThanOneWeek = 'lessThanOneWeek',
  LessThanOneMonth = 'lessThanOneMonth',
  LessThanOneYear = 'lessThanOneYear',
  GreaterThanOneYear = 'greaterThanOneYear',
}

const durationCategoryToMs: Record<DurationCategory, number> = {
  [DurationCategory.LessThanOneHour]: 60 * 60 * 1000,
  [DurationCategory.LessThanOneDay]: 24 * 60 * 60 * 1000,
  [DurationCategory.LessThanOneWeek]: 7 * 24 * 60 * 60 * 1000,
  [DurationCategory.LessThanOneMonth]: 30 * 24 * 60 * 60 * 1000,
  [DurationCategory.LessThanOneYear]: 365 * 24 * 60 * 60 * 1000,
  [DurationCategory.GreaterThanOneYear]: Infinity,
};

// Extended Services metrics expose per-minute data, so we want minutely
// granularity to be selectable on the Last 1 Day view (the default same-day
// allow-list only goes down to half-hour). This override adds OneMinute for the
// WithinLast1Day category while preserving the standard same-day options.
const extendedServicesLast1DayGranularities: Array<RAQIV2MetricGranularity> = [
  RAQIV2MetricGranularity.OneMinute,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.OneDay,
];

// Extended Services metrics that opt into minutely-on-Last-1-Day. Extend this
// list as other Extended Services adopt it.
const extendedServicesMinutelyOnLast1DayOverride: Partial<
  Record<TRAQIV2UIMetric, Partial<Record<StartDateCategory, Array<RAQIV2MetricGranularity>>>>
> = Object.fromEntries(
  [
    RAQIV2Metric.DataStoreStorageUsageBytes,
    RAQIV2Metric.DataStoreStorageQuotaBytes,
    RAQIV2Metric.DataStoreRequests,
    RAQIV2Metric.DataStoreRequestsByEndpoint,
    RAQIV2Metric.DataStoreRequestsByStatus,
    RAQIV2Metric.DataStoreReadRequests,
    RAQIV2Metric.DataStoreReadRequestsByEndpoint,
    RAQIV2Metric.DataStoreConsumedReadRequests,
    RAQIV2Metric.DataStoreWriteRequests,
    RAQIV2Metric.DataStoreWriteRequestsByEndpoint,
    RAQIV2Metric.DataStoreConsumedWriteRequests,
    RAQIV2Metric.DataStoreListRequests,
    RAQIV2Metric.DataStoreListRequestsByEndpoint,
    RAQIV2Metric.DataStoreConsumedListRequests,
    RAQIV2Metric.DataStoreRemoveRequests,
    RAQIV2Metric.DataStoreRemoveRequestsByEndpoint,
    RAQIV2Metric.DataStoreConsumedRemoveRequests,
    RAQIV2Metric.MemoryStoreErrorRateAlert,
    RAQIV2Metric.MemoryStoreMemoryQuotaBytes,
    RAQIV2Metric.MemoryStoreMemoryUsageAlert,
    RAQIV2Metric.MemoryStoreMemoryUsageBytes,
    RAQIV2Metric.MemoryStoreRequests,
    RAQIV2Metric.MemoryStoreRequestsByEndpoint,
    RAQIV2Metric.MemoryStoreRequestsByStatus,
    RAQIV2Metric.MemoryStoreRequestUnits,
    RAQIV2Metric.MemoryStoreRequestUnitsByEndpoint,
    RAQIV2Metric.MemoryStoreRequestUnitsQuota,
    RAQIV2Metric.MemoryStoreThrottlingAlert,
    RAQIV2Metric.VideoServiceExclusivePlaybackSeconds,
  ].map((metric) => [
    metric,
    { [StartDateCategory.WithinLast1Day]: extendedServicesLast1DayGranularities },
  ]),
);

// This object provides per-metric overrides to define which granularities are available for each metric and timeframe category.
// This is useful for handling metrics with special granularity needs in particular time frames (for example, limiting granularities for concurrent player metrics for the last 28 or 365 days).
const allowedGranularitiesOverrideByMetricAndStartDateCategory: Partial<
  Record<TRAQIV2UIMetric, Partial<Record<StartDateCategory, Array<RAQIV2MetricGranularity>>>>
> = {
  ...extendedServicesMinutelyOnLast1DayOverride,
  [RAQIV2Metric.ConcurrentPlayers]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2Metric.PeakConcurrentPlayers]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2Metric.ComputeEfficiency]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2Metric.ClientCrashRate15m]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ClientFps]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ClientMemoryUsage]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ClientMemoryUsagePercentage]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.SessionDurationSeconds]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ServerFrameRate]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ServerMemoryUsage]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.CoresPerServer]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ServerCpuTime]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ServerMemoryUsageV2]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
  [RAQIV2UIMetric.ServerMemoryUsageByServerAge]: {
    // Only "None" granularity is appropriate for the server memory by age chart, across all time ranges.
    [StartDateCategory.WithinLastHour]: [RAQIV2MetricGranularity.None],
    [StartDateCategory.WithinLast1Day]: [RAQIV2MetricGranularity.None],
    [StartDateCategory.WithinLast7Days]: [RAQIV2MetricGranularity.None],
    [StartDateCategory.WithinLast28Days]: [RAQIV2MetricGranularity.None],
    [StartDateCategory.WithinLast365Days]: [RAQIV2MetricGranularity.None],
  },
  [RAQIV2Metric.ErrorCount]: {
    [StartDateCategory.WithinLast28Days]: [
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
    ],
  },
};

// Specifies the display order of granularities for UI and option lists.
export const GranularityOrdering = [
  RAQIV2MetricGranularity.OneMinute,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneWeek,
  RAQIV2MetricGranularity.OneMonth,
  RAQIV2MetricGranularity.None,
] as const;

export type GranularityOption =
  | {
      granularity: RAQIV2MetricGranularity;
      isAllowed: true;
    }
  | {
      granularity: RAQIV2MetricGranularity;
      isAllowed: false;
      messageKey: TranslationKey;
    };

// Produces the available granularities for a metric based on its date range and breakdown selection.
// Returns an array of objects indicating each granularity, its availability, and (optionally) a reason if it is unavailable.
//
// `configConstraints` (from a page's `granularity.constraints`) take precedence
// over the hand-written date-range matrix: any granularity listed there is
// governed entirely by its rule list (per-granularity replacement), so a metric
// that fundamentally supports the granularity can opt it into — or out of — a
// range that the matrix would otherwise decide. Granularities absent from
// `configConstraints` keep the matrix behavior unchanged.
const getGranularityOptionsForMetric = ({
  metric,
  startDate,
  endDate,
  breakdown,
  configConstraints,
}: {
  metric: TRAQIV2UIMetric;
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
  configConstraints?: Partial<Record<TUIGranularity, GranularityConstraintRule[]>>;
}): Array<GranularityOption> => {
  const supportedGranularities: readonly RAQIV2MetricGranularity[] =
    RAQIV2MetricToSupportedGranularities[metric];

  const allowedOptions = supportedGranularities.filter((granularity) => {
    // Page-config constraints replace the matrix for the granularities they list:
    // a listed granularity is decided solely by its rule list, bypassing the
    // date-range matrix (and the breakdown-based None handling below).
    if (configConstraints?.[granularity] != null) {
      return isGranularityAllowedByConstraints({
        constraints: configConstraints,
        granularity,
        startDate,
        endDate,
      });
    }

    if (granularity === RAQIV2MetricGranularity.None) {
      if (breakdown?.length) {
        // For duration-based charts (where the breakdown includes a duration bucket dimension), allow "None" granularity
        // only when there is also at least one non-duration breakdown selected.
        return breakdown.filter((dimension) => !isDurationBucketDimension(dimension)).length >= 1;
      }
      // When no breakdown is provided, cumulative shows a single total bar.
      return true;
    }

    // 1. Determine which time category the start date falls in
    const lastHourAgo = subHours(getCurrentHourDate(), 1);
    const last1DayAgo = subDays(startOfToday(), 1);
    const sevenDaysAgo = subDays(startOfToday(), 7);
    const last28DaysAgo = subDays(startOfToday(), 28);
    const last365DaysAgo = subDays(startOfToday(), 365);

    let startDateCategory = StartDateCategory.OneYearAgo;
    if (startDate >= lastHourAgo) {
      startDateCategory = StartDateCategory.WithinLastHour;
    } else if (startDate >= last1DayAgo) {
      startDateCategory = StartDateCategory.WithinLast1Day;
    } else if (startDate >= sevenDaysAgo) {
      startDateCategory = StartDateCategory.WithinLast7Days;
    } else if (startDate >= last28DaysAgo) {
      startDateCategory = StartDateCategory.WithinLast28Days;
    } else if (startDate >= last365DaysAgo) {
      startDateCategory = StartDateCategory.WithinLast365Days;
    } else {
      startDateCategory = StartDateCategory.OneYearAgo;
    }

    // 2. Apply any special granularity overrides for this metric and date category, if present
    const overridenGranularities =
      allowedGranularitiesOverrideByMetricAndStartDateCategory[metric]?.[startDateCategory];
    if (overridenGranularities) {
      return overridenGranularities.includes(granularity);
    }

    // 3. Determine which duration category the (endDate - startDate) difference fits in
    const durationMs = Math.abs(endDate.getTime() - startDate.getTime());
    const durationCategory = getRecordEntries(durationCategoryToMs).find(
      ([, durationToCompare]) => durationMs <= durationToCompare,
    )?.[0];

    switch (startDateCategory) {
      case StartDateCategory.WithinLastHour:
        // Allow minute, half-hour, and hour for last-hour range.
        return [
          RAQIV2MetricGranularity.OneMinute,
          RAQIV2MetricGranularity.HalfHour,
          RAQIV2MetricGranularity.OneHour,
        ].includes(granularity);
      case StartDateCategory.WithinLast1Day:
        // Allow only hour or day for same-day range.
        return [
          RAQIV2MetricGranularity.HalfHour,
          RAQIV2MetricGranularity.OneHour,
          RAQIV2MetricGranularity.OneDay,
        ].includes(granularity);
      case StartDateCategory.WithinLast7Days:
        // Allow half-hour, hour, or day granularity for past week range.
        return [
          RAQIV2MetricGranularity.HalfHour,
          RAQIV2MetricGranularity.OneHour,
          RAQIV2MetricGranularity.OneDay,
        ].includes(granularity);
      case StartDateCategory.WithinLast28Days:
      case StartDateCategory.WithinLast365Days:
      case StartDateCategory.OneYearAgo: {
        // For ranges starting 28 days (or further) ago, the granularity depends on the duration.
        // E.g., only daily granularity may be allowed if the range is short, but weekly/monthly otherwise.
        switch (durationCategory) {
          case DurationCategory.LessThanOneHour:
            return [RAQIV2MetricGranularity.OneHour].includes(granularity);
          case DurationCategory.LessThanOneDay:
            return [RAQIV2MetricGranularity.OneDay].includes(granularity);
          case DurationCategory.LessThanOneWeek:
            return [RAQIV2MetricGranularity.OneDay].includes(granularity);
          case DurationCategory.LessThanOneMonth:
            return [RAQIV2MetricGranularity.OneDay, RAQIV2MetricGranularity.OneWeek].includes(
              granularity,
            );
          case DurationCategory.LessThanOneYear:
            return [
              RAQIV2MetricGranularity.OneDay,
              RAQIV2MetricGranularity.OneWeek,
              RAQIV2MetricGranularity.OneMonth,
            ].includes(granularity);
          case DurationCategory.GreaterThanOneYear:
          case undefined:
            return [RAQIV2MetricGranularity.OneWeek, RAQIV2MetricGranularity.OneMonth].includes(
              granularity,
            );
          default:
            throw new Error('Unhandled duration category');
        }
      }
      default:
        throw new Error('Unhandled date range category');
    }
  });

  // Display only those granularities that are permitted, sorting them in a fixed order for consistency in the UI
  const orderedAllowedOptions = allowedOptions
    .sort((a, b) => {
      const aIndex = GranularityOrdering.indexOf(a);
      const bIndex = GranularityOrdering.indexOf(b);
      return aIndex - bIndex;
    })
    .map(
      (granularity) =>
        ({
          granularity,
          isAllowed: true,
        }) as const,
    );

  // Surface a disabled Cumulative option only when the metric supports it but the
  // current breakdown disables it (e.g. the breakdown contains only duration-bucket
  // dimensions) — that's an actionable hint: add a non-duration breakdown to enable it.
  // When the metric never supports Cumulative, omit it entirely instead of showing a
  // permanently-disabled, non-actionable option, consistent with how every other
  // unsupported granularity is simply not listed.
  if (
    !allowedOptions.includes(RAQIV2MetricGranularity.None) &&
    supportedGranularities.includes(RAQIV2MetricGranularity.None)
  ) {
    return [
      ...orderedAllowedOptions,
      {
        granularity: RAQIV2MetricGranularity.None,
        isAllowed: false,
        messageKey: translationKey(
          'Description.NeedsBreakdownForBarChart',
          TranslationNamespace.Analytics,
        ),
      } as const,
    ];
  }
  return orderedAllowedOptions;
};

export default getGranularityOptionsForMetric;

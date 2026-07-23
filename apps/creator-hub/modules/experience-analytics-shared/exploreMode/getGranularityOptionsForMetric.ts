import {
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedGranularities,
  RAQIV2UIMetric,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import { startOfToday, subDays } from '@rbx/core';
import { getCurrentHourDate, subHours } from '@modules/charts-generic';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getRecordEntries } from '@modules/miscellaneous/common/utils/helperUtils';
import { isDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';

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

// This object provides per-metric overrides to define which granularities are available for each metric and timeframe category.
// This is useful for handling metrics with special granularity needs in particular time frames (for example, limiting granularities for concurrent player metrics for the last 28 or 365 days).
const allowedGranularitiesOverrideByMetricAndStartDateCategory: Partial<
  Record<TRAQIV2UIMetric, Partial<Record<StartDateCategory, Array<RAQIV2MetricGranularity>>>>
> = {
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
const getGranularityOptionsForMetric = ({
  metric,
  startDate,
  endDate,
  breakdown,
}: {
  metric: TRAQIV2UIMetric;
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
}): Array<GranularityOption> => {
  const supportedGranularities = RAQIV2MetricToSupportedGranularities[metric];

  const allowedOptions = supportedGranularities.filter((granularity) => {
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
          default: {
            const exhaustiveCheck: never = durationCategory;
            throw new Error(`Unhandled duration category: ${exhaustiveCheck}`);
          }
        }
      }
      default: {
        const exhaustiveCheck: never = startDateCategory;
        throw new Error(`Unhandled date range category: ${exhaustiveCheck}`);
      }
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

  // If cumulative granularity isn't currently allowed
  // (e.g. breakdown contains only duration-bucket dimensions), append a disabled option.
  if (!allowedOptions.includes(RAQIV2MetricGranularity.None)) {
    const messageKey = supportedGranularities.includes(RAQIV2MetricGranularity.None)
      ? translationKey('Description.NeedsBreakdownForBarChart', TranslationNamespace.Analytics)
      : translationKey('Description.UnsupportedGranularity', TranslationNamespace.Analytics);
    return [
      ...orderedAllowedOptions,
      {
        granularity: RAQIV2MetricGranularity.None,
        isAllowed: false,
        messageKey,
      } as const,
    ];
  }
  return orderedAllowedOptions;
};

export default getGranularityOptionsForMetric;

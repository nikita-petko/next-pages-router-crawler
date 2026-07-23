import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type {
  AnalyticsPageConfigDateOptions,
  GranularityConstraintRule,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { TUIGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';

type ConfigurableGranularityOptions = {
  options: TUIGranularity[];
  constraints?: Partial<Record<TUIGranularity, GranularityConstraintRule[]>>;
};

export const journeysTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last1Day,
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Last365Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxStartDateOffsetDays: 365 * 2,
  maxRangeDays: 365 * 2 + 1,
} satisfies AnalyticsPageConfigDateOptions;

export const recommendedEventsTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last1Day,
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Last365Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxStartDateOffsetDays: 365 * 2,
  maxRangeDays: 365 * 2 + 1,
} satisfies AnalyticsPageConfigDateOptions;

export const recommendedEventsIntervalGranularityOptions = {
  options: [
    RAQIV2MetricGranularity.OneHour,
    RAQIV2MetricGranularity.OneDay,
    RAQIV2MetricGranularity.OneWeek,
    RAQIV2MetricGranularity.OneMonth,
  ],
  constraints: {
    [RAQIV2MetricGranularity.OneHour]: [{ type: 'freshness', startWithinDays: 7 }],
  },
} satisfies ConfigurableGranularityOptions;

export const recommendedEventsCumulativeGranularityOptions = {
  options: [...recommendedEventsIntervalGranularityOptions.options, RAQIV2MetricGranularity.None],
  constraints: recommendedEventsIntervalGranularityOptions.constraints,
} satisfies ConfigurableGranularityOptions;

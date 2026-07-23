import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TimeInterval } from '../types';

/** Authoring DTO time-interval literal -> render-time `RAQIV2MetricGranularity`. */
export const TIME_INTERVAL_TO_GRANULARITY: Record<TimeInterval, RAQIV2MetricGranularity> = {
  Cumulative: RAQIV2MetricGranularity.None,
  Day: RAQIV2MetricGranularity.OneDay,
  Week: RAQIV2MetricGranularity.OneWeek,
  Hour: RAQIV2MetricGranularity.OneHour,
  HalfHour: RAQIV2MetricGranularity.HalfHour,
  Minute: RAQIV2MetricGranularity.OneMinute,
};

/** Inverse: granularity -> DTO literal. Returns `undefined` for unsupported values. */
export const GRANULARITY_TO_TIME_INTERVAL: Partial<Record<RAQIV2MetricGranularity, TimeInterval>> =
  {
    [RAQIV2MetricGranularity.None]: 'Cumulative',
    [RAQIV2MetricGranularity.OneDay]: 'Day',
    [RAQIV2MetricGranularity.OneWeek]: 'Week',
    [RAQIV2MetricGranularity.OneHour]: 'Hour',
    [RAQIV2MetricGranularity.HalfHour]: 'HalfHour',
    [RAQIV2MetricGranularity.OneMinute]: 'Minute',
  };

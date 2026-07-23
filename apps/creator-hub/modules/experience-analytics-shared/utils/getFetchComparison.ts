import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { DEFAULT_COMPARISON_CONFIG, type ComparisonRangePolicy } from '../types/ComparisonConfig';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';
import { FetchComparisonSeriesMode } from './makeRAQIV2Request';

const getFetchComparison = (
  showComparison: boolean,
  granularity: RAQIV2MetricGranularity,
  rangePolicy: ComparisonRangePolicy = DEFAULT_COMPARISON_CONFIG.rangePolicy,
  relativeOffset?: ComparisonOverlay['relativeOffset'],
  customStartDate?: ComparisonOverlay['customStartDate'],
) => {
  if (!showComparison) {
    return undefined;
  }

  // Combined fetch expands the window then slices by datapoint timestamp. That
  // only works for bucketed series. None/cumulative returns one aggregate for
  // the whole request range — slicing drops it (or can't split primary vs
  // comparison). Use Separate so each window is its own None query.
  if (granularity === RAQIV2MetricGranularity.None) {
    return {
      mode: FetchComparisonSeriesMode.Separate,
      granularity,
      rangePolicy,
      relativeOffset,
      customStartDate,
    };
  }

  return {
    mode: FetchComparisonSeriesMode.Combined,
    granularity,
    rangePolicy,
    relativeOffset,
    customStartDate,
  };
};

export default getFetchComparison;

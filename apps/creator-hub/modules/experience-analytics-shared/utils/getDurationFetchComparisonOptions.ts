import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { ComparisonRangePolicy } from '../types/ComparisonConfig';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';
import type { FetchComparisonOptions } from './makeRAQIV2Request';
import { FetchComparisonSeriesMode } from './makeRAQIV2Request';

const getDurationFetchComparisonOptions = ({
  showComparisonChip,
  showComparisonInChart,
  rangePolicy,
  comparisonOffset,
  comparisonCustomStartDate,
}: {
  showComparisonChip: boolean;
  showComparisonInChart: boolean;
  rangePolicy: ComparisonRangePolicy;
  comparisonOffset?: ComparisonOverlay['relativeOffset'];
  comparisonCustomStartDate?: ComparisonOverlay['customStartDate'];
}): FetchComparisonOptions | undefined =>
  showComparisonChip || showComparisonInChart
    ? {
        mode: FetchComparisonSeriesMode.Separate,
        granularity: RAQIV2MetricGranularity.OneDay,
        rangePolicy,
        relativeOffset: comparisonOffset,
        customStartDate: comparisonCustomStartDate,
      }
    : undefined;

export default getDurationFetchComparisonOptions;

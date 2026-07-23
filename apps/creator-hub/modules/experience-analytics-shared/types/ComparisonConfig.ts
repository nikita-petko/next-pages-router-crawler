export type ComparisonRangePolicy = 'shortRangeOnly' | 'allRanges';

export type ComparisonConfig = {
  /** Whether chart summaries may render period-over-period comparison chips. */
  chip?: boolean;
  /**
   * Controls which selected date ranges may fetch comparison data. This policy
   * applies to every comparison consumer, including summary chips and in-chart
   * series; it does not enable either consumer by itself. `shortRangeOnly`
   * suppresses comparison data for ranges of 180 inclusive calendar days or
   * longer when the comparison range-policy feature flag is enabled, while
   * `allRanges` explicitly opts out of that cutoff.
   */
  rangePolicy?: ComparisonRangePolicy;
};

export const DEFAULT_COMPARISON_CONFIG = {
  chip: true,
  rangePolicy: 'shortRangeOnly',
} as const satisfies Required<ComparisonConfig>;

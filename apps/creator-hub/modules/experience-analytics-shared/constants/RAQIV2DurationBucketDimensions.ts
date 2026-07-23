import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { DurationBucketType } from '@modules/charts-generic/charts/types/DurationSplineChartTypes';

const DurationBucketDimensions = [
  RAQIV2Dimension.SessionTimeBucket,
  RAQIV2Dimension.ServerAgeBucket,
  RAQIV2Dimension.CohortDay,
] as const;
export type TDurationBucketDimension = (typeof DurationBucketDimensions)[number];
const DurationBucketDimensionSet: ReadonlySet<TRAQIV2Dimension> = new Set(DurationBucketDimensions);

export function isDurationBucketDimension(
  dimension: TRAQIV2Dimension,
): dimension is TDurationBucketDimension {
  return DurationBucketDimensionSet.has(dimension);
}

const ComparisonCompatibleDurationBucketDimensions = [
  RAQIV2Dimension.SessionTimeBucket,
  RAQIV2Dimension.CohortDay,
] as const;

export type TComparisonCompatibleDurationBucketDimension =
  (typeof ComparisonCompatibleDurationBucketDimensions)[number];
const ComparisonCompatibleDurationBucketDimensionSet: ReadonlySet<TRAQIV2Dimension> = new Set(
  ComparisonCompatibleDurationBucketDimensions,
);

export function isComparisonCompatibleDurationBucketDimension(
  dimension: TRAQIV2Dimension,
): dimension is TComparisonCompatibleDurationBucketDimension {
  return ComparisonCompatibleDurationBucketDimensionSet.has(dimension);
}

export const DurationBucketDimensionToBucketType: Record<
  TDurationBucketDimension,
  DurationBucketType
> = {
  [RAQIV2Dimension.SessionTimeBucket]: DurationBucketType.SecondsSinceStart,
  [RAQIV2Dimension.ServerAgeBucket]: DurationBucketType.ServerMemoryAge,
  [RAQIV2Dimension.CohortDay]: DurationBucketType.CohortDay,
};

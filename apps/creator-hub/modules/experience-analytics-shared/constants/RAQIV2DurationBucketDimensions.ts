import { DurationBucketType } from '@modules/charts-generic';
import { RAQIV2Dimension, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

const DurationBucketDimensions = [
  RAQIV2Dimension.SessionTimeBucket,
  RAQIV2Dimension.ServerAgeBucket,
  RAQIV2Dimension.CohortDay,
] as const;
export type TDurationBucketDimension = (typeof DurationBucketDimensions)[number];

export function isDurationBucketDimension(
  dimension: TRAQIV2Dimension,
): dimension is TDurationBucketDimension {
  return DurationBucketDimensions.includes(dimension as TDurationBucketDimension);
}

export const DurationBucketDimensionToBucketType: Record<
  TDurationBucketDimension,
  DurationBucketType
> = {
  [RAQIV2Dimension.SessionTimeBucket]: DurationBucketType.SecondsSinceStart,
  [RAQIV2Dimension.ServerAgeBucket]: DurationBucketType.ServerMemoryAge,
  [RAQIV2Dimension.CohortDay]: DurationBucketType.CohortDay,
};

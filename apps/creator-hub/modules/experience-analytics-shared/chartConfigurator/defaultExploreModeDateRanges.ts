import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';

// TODO(DSA-6197): Separate dashboard-wide ranges from metric fallback ranges.
export const DefaultExploreModeDateRanges = [
  RAQIV2DateRangeType.Last1Hour,
  RAQIV2DateRangeType.Last1Day,
  RAQIV2DateRangeType.Last3Days,
  RAQIV2DateRangeType.Last7Days,
  RAQIV2DateRangeType.Last28Days,
  RAQIV2DateRangeType.Last56Days,
  RAQIV2DateRangeType.Last90Days,
  RAQIV2DateRangeType.Custom,
] as const;

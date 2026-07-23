import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';

// Offset of 0 is used to denote that this range type
// doesn't get aligned to UTC midnight, and so requires a little
// different logic than the rest
const dateRangeOffsetDays: Record<RAQIV2DateRangeType, number> = {
  [RAQIV2DateRangeType.Last1Hour]: 0,
  [RAQIV2DateRangeType.Last1Day]: 0,
  [RAQIV2DateRangeType.Last3Days]: 3,
  [RAQIV2DateRangeType.Last7Days]: 7,
  [RAQIV2DateRangeType.Last28Days]: 28,
  [RAQIV2DateRangeType.Last56Days]: 56,
  [RAQIV2DateRangeType.Last90Days]: 90,
  [RAQIV2DateRangeType.Last365Days]: 365,
  [RAQIV2DateRangeType.Custom]: 0,
};

export default dateRangeOffsetDays;

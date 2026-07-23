import DateRangeType from '../enums/DateRangeType';

// Offset of 0 is used to denote that this range type
// doesn't get aligned to UTC midnight, and so requires a little
// different logic than the rest
const dateRangeOffsetDays: Record<DateRangeType, number> = {
  [DateRangeType.Last1Hour]: 0,
  [DateRangeType.Last1Day]: 0,
  [DateRangeType.Last3Days]: 3,
  [DateRangeType.Last7Days]: 7,
  [DateRangeType.Last28Days]: 28,
  [DateRangeType.Last56Days]: 56,
  [DateRangeType.Last90Days]: 90,
  [DateRangeType.Last365Days]: 365,
  [DateRangeType.Custom]: 0,
};

export default dateRangeOffsetDays;

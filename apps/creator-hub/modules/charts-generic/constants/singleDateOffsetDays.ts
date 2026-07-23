import SingleDateType from '../enums/SingleDateType';

// Offset of 0 is used to denote that this range type
// doesn't get aligned to UTC midnight, and so requires a little
// different logic than the rest
const singleDateOffsetDays: Record<SingleDateType, number> = {
  [SingleDateType.MostRecent]: 1,
  [SingleDateType.SevenDaysAgo]: 7,
  [SingleDateType.ThirtyDaysAgo]: 30,
  [SingleDateType.SixtyDaysAgo]: 60,
  [SingleDateType.NinetyDaysAgo]: 90,
  [SingleDateType.ThreeSixtyFiveDaysAgo]: 365,
  [SingleDateType.Custom]: 0,
};

export default singleDateOffsetDays;

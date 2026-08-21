/**
 * Earliest license start calendar day: local midnight of `fromDate` plus `leadDays` whole days.
 * Matches {@link DateRangeSelector} with `disablePast` and `minimumLeadDaysBeforeSelectableDate`.
 */
export default function getEarliestSelectableLicenseStartMidnight(
  leadDays: number,
  fromDate: Date = new Date(),
): Date {
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const shifted = new Date(base);
  shifted.setDate(shifted.getDate() + leadDays);
  return new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
}

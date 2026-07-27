/**
 * Builds the `&custom_start_date=…&custom_end_date=…` query fragment for
 * AMA's date-filter endpoints. Only appended when both dates are supplied;
 * AMA rejects requests with only one custom date, and validates that
 * `time_period === CUSTOM (9)` whenever custom dates are present.
 */
export const getCustomDateSection = (customStartDate?: string, customEndDate?: string) =>
  customStartDate && customEndDate
    ? `&custom_start_date=${customStartDate}&custom_end_date=${customEndDate}`
    : '';

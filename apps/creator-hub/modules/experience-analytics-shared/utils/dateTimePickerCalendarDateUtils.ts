// Analytics stores all calendar dates as UTC midnight so the chart data layer
// can slice and snap consistently regardless of the user's timezone.
// Foundation DateTimePicker compares and emits dates using local-time getters,
// so picker inputs must be projected onto local calendar days at the boundary.
export const utcMidnightToLocalCalendarDate = (date: Date): Date =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const localCalendarDateToUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

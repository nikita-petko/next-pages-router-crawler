/**
 * NOTE(gperkins@ 20240229): kept from the original creator-hub implementation.
 * Shifts a UTC date into a naive "local-looking" date so downstream consumers
 * that treat dates as local (MUI's `<DatePicker>`, `Intl.DateTimeFormat` in
 * "UTC" mode) render the correct calendar day.
 */
export const shiftUtcToLocal = (date: Date): Date => {
  const offsetMinutes = date.getTimezoneOffset();
  const shifted = new Date(date);
  shifted.setMinutes(date.getMinutes() + offsetMinutes);
  return shifted;
};

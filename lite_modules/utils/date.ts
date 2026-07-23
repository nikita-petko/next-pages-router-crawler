import moment from 'moment-timezone';

const defaultTimezone = 'America/Los_Angeles';
const MMMDYYYY_MOMENT_FORMAT = 'MMM D, YYYY';
const MMMMDYYYYHMMAT_MOMENT_FORMAT = 'MMMM D, YYYY [at] h:mm A';

export const IsValidDate = (d: Date | null) => d instanceof Date && !Number.isNaN(d.getTime());

export const GetNextMonthStartUtc = () => {
  const today = new Date();
  let nextMonth = today.getUTCMonth() + 1;
  let year = today.getUTCFullYear();

  // Month is 0 indexed.
  if (nextMonth > 11) {
    nextMonth = 0;
    year += 1;
  }
  return new Date(Date.UTC(year, nextMonth, 1, 0, 0, 0));
};

const isValidTimezone = (timezone: string) => moment.tz.zone(timezone) != null;

export const FormatDateToMMMMDYYYYHMMAT = ({
  timestamp,
  timezone,
}: {
  timestamp?: number;
  timezone: string;
}): string => {
  if (!timestamp) {
    return '';
  }

  const timeToFormat = moment.tz(timestamp, timezone);

  if (timeToFormat.isValid() && isValidTimezone(timezone)) {
    return `${timeToFormat.format(MMMMDYYYYHMMAT_MOMENT_FORMAT)}`;
  }

  return moment(timestamp).tz(defaultTimezone).format(MMMMDYYYYHMMAT_MOMENT_FORMAT);
};

export const FormatDateToMMMDYYYY = ({
  timestamp,
  timezone,
}: {
  timestamp?: number;
  timezone: string;
}): string => {
  if (!timestamp) {
    return '';
  }

  const timeToFormat = moment.tz(timestamp, timezone);

  if (timeToFormat.isValid() && isValidTimezone(timezone)) {
    return `${timeToFormat.format(MMMDYYYY_MOMENT_FORMAT)}`;
  }

  return moment(timestamp).tz(defaultTimezone).format(MMMDYYYY_MOMENT_FORMAT);
};

export const GetTimezoneOffsetMs = (timeZone: string) => {
  const computerTimeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const computerOffsetInMs = moment.tz(Date.now(), computerTimeZoneName).utcOffset() * 60 * 1000;
  const momentDate = moment.tz(Date.now(), timeZone);
  const utcOffsetInMS = momentDate.utcOffset() * 60 * 1000;
  return utcOffsetInMS - computerOffsetInMs;
};

export const NUMBER_OF_MS_IN_A_DAY = 86400000;

// getDurationInDays returns duration in days by the date (endDate - startDate + 1)
// 10/10/23 - 10/10/23 count as 1 day
// 10/10/23 - 10/11/23 count as 2 days
// 10/03/03 - 11/03/23 count as 32 days
export const GetDurationInDays = (startMs: number, endMs: number, timezone?: string) => {
  if (timezone) {
    const start = moment(startMs).tz(timezone).startOf('day');
    const end = moment(endMs).tz(timezone).startOf('day');
    return Math.abs(end.diff(start, 'days')) + 1;
  }

  // returning default duration calculation if timezone unavailable
  const durationInMilliseconds = Math.abs(startMs - endMs);
  const durationInDays = Math.ceil(durationInMilliseconds / NUMBER_OF_MS_IN_A_DAY);

  return durationInDays + 1;
};

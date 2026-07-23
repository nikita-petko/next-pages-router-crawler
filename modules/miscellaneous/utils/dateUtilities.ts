import moment from 'moment-timezone';

import { TODOFIXANY } from 'app/shared/types';

const convertMsToDate = (seconds: number, timezone?: string) => {
  if (timezone) {
    return moment(seconds).tz(timezone).format('MMM D, YYYY');
  }

  return new Date(seconds).toLocaleDateString('us', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  });
};

const convertMsToVerboseDate = (seconds: number, timezone?: string) => {
  if (timezone) {
    return moment(seconds).tz(timezone).format('M/D/YYYY h:mm:ss A z');
  }

  return new Date(seconds).toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    month: 'numeric',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
    year: 'numeric',
  });
};

const NUMBER_OF_MS_IN_A_DAY = 86400000;

const msToDay = (startMs: number, endMs: number) => {
  return Math.ceil((endMs - startMs) / NUMBER_OF_MS_IN_A_DAY);
};

// getDurationInDays returns duration in days by the date (endDate - startDate + 1)
// 10/10/23 - 10/10/23 count as 1 day
// 10/10/23 - 10/11/23 count as 2 days
// 10/03/03 - 11/03/23 count as 32 days
const getDurationInDays = (startMs: number, endMs: number, timezone?: string) => {
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

const formatDateToMMDDYYYY = (inputDate: TODOFIXANY) => {
  let date;
  let month;

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  const year = inputDate.getFullYear();

  date = date.toString().padStart(2, '0');

  month = month.toString().padStart(2, '0');

  return `${month}/${date}/${year}`;
};

const isValidTimezone = (timezone: string) => {
  return moment.tz.zone(timezone) != null;
};

const defaultTimezone = 'America/Los_Angeles';
const MMMMDYYYYHMMAT_MOMENT_FORMAT = 'MMMM D, YYYY [at] h:mm A';
const MMMMDYYYYHMMAZ_MOMENT_FORMAT = 'MMMM D, YYYY [at] h:mm A z';

const formatDateToMMMMDYYYYHMMAT = ({
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

const formatDateToMMMMDYYYYHMMATZ = ({
  timestamp,
  timezone,
  timezoneStr,
}: {
  timestamp?: number;
  timezone: string;
  timezoneStr: string;
}): string => {
  if (!timestamp) {
    return '';
  }

  const timeToFormat = moment.tz(timestamp, timezone);

  if (timeToFormat.isValid() && isValidTimezone(timezone)) {
    return `${timeToFormat.format(MMMMDYYYYHMMAT_MOMENT_FORMAT)} ${timezoneStr}`;
  }

  return moment(timestamp).tz(defaultTimezone).format(MMMMDYYYYHMMAZ_MOMENT_FORMAT);
};

export {
  convertMsToDate,
  convertMsToVerboseDate,
  msToDay,
  getDurationInDays,
  formatDateToMMDDYYYY,
  formatDateToMMMMDYYYYHMMATZ,
  formatDateToMMMMDYYYYHMMAT,
};

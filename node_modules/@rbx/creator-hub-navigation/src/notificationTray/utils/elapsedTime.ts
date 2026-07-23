const SECONDS_IN_MS = 1000;
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 3600;
const DAY_IN_SECONDS = 86400;
const WEEK_IN_SECONDS = 604800;
const MONTH_IN_SECONDS = 2628000;
const YEAR_IN_SECONDS = 31536000;

type TcalculateElapsedTime = {
  translationKey: string;
  translationKeyParam?: string;
  paramValue?: number;
};

export function calculateElapsedTime(timestampInSeconds?: number): TcalculateElapsedTime {
  if (!timestampInSeconds) {
    return { translationKey: '' };
  }

  const current = Math.floor(Date.now() / SECONDS_IN_MS);
  const elapsedTime = current - timestampInSeconds;

  if (elapsedTime < MINUTE_IN_SECONDS) {
    return {
      translationKey: 'Now',
    };
  }
  if (elapsedTime < HOUR_IN_SECONDS) {
    const minutes = Math.floor(elapsedTime / MINUTE_IN_SECONDS);
    return {
      translationKey: 'Minutes',
      translationKeyParam: 'minutes',
      paramValue: minutes,
    };
  }
  if (elapsedTime < DAY_IN_SECONDS) {
    const hours = Math.floor(elapsedTime / HOUR_IN_SECONDS);
    return {
      translationKey: 'Hours',
      translationKeyParam: 'hours',
      paramValue: hours,
    };
  }
  if (elapsedTime < WEEK_IN_SECONDS) {
    const days = Math.floor(elapsedTime / DAY_IN_SECONDS);
    return {
      translationKey: 'Days',
      translationKeyParam: 'days',
      paramValue: days,
    };
  }
  if (elapsedTime < MONTH_IN_SECONDS) {
    const weeks = Math.floor(elapsedTime / WEEK_IN_SECONDS);
    return {
      translationKey: 'Weeks',
      translationKeyParam: 'weeks',
      paramValue: weeks,
    };
  }
  if (elapsedTime < YEAR_IN_SECONDS) {
    const months = Math.floor(elapsedTime / MONTH_IN_SECONDS);
    return {
      translationKey: 'Months',
      translationKeyParam: 'months',
      paramValue: months,
    };
  }
  const years = Math.floor(elapsedTime / YEAR_IN_SECONDS);
  return {
    translationKey: 'Years',
    translationKeyParam: 'years',
    paramValue: years,
  };
}

const MINUTES_IN_MS = MINUTE_IN_SECONDS * SECONDS_IN_MS;
const DAYS_IN_MS = DAY_IN_SECONDS * SECONDS_IN_MS;

export function getRefreshIntervalInMS(timestampInSeconds: number) {
  if (!timestampInSeconds) {
    return null;
  }

  const current = Math.floor(Date.now() / SECONDS_IN_MS);
  const elapsedTime = current - timestampInSeconds;

  if (elapsedTime < HOUR_IN_SECONDS) {
    return MINUTES_IN_MS;
  }
  if (elapsedTime < DAY_IN_SECONDS) {
    return DAYS_IN_MS;
  }

  return null;
}

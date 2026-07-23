import moment from 'moment-timezone';

import { DateFormat, TimeFormat } from '@constants/campaignBuilder';

interface SelectedTimeConversion {
  browserLocalTime: string;
}

interface GetSelectedTimeConversionParams {
  browserTimezoneDbName?: string;
  date?: string;
  locale?: string | null;
  time?: string;
  timezoneDbName: string;
}

const getBrowserTimezoneDbName = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || moment.tz.guess() || 'UTC';

const formatSelectedTime = ({
  date,
  locale,
  timezoneDbName,
}: {
  date: Date;
  locale?: string | null;
  timezoneDbName: string;
}): string =>
  new Intl.DateTimeFormat(locale || undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: timezoneDbName,
    year: 'numeric',
  }).format(date);

export const getSelectedTimeConversion = ({
  browserTimezoneDbName = getBrowserTimezoneDbName(),
  date,
  locale,
  time,
  timezoneDbName,
}: GetSelectedTimeConversionParams): SelectedTimeConversion | null => {
  if (!date || !time) {
    return null;
  }

  const selectedMoment = moment.tz(
    `${date} ${time}`,
    `${DateFormat} ${TimeFormat}`,
    timezoneDbName,
  );

  if (!selectedMoment.isValid()) {
    return null;
  }

  const selectedDate = selectedMoment.toDate();

  return {
    browserLocalTime: formatSelectedTime({
      date: selectedDate,
      locale,
      timezoneDbName: browserTimezoneDbName,
    }),
  };
};

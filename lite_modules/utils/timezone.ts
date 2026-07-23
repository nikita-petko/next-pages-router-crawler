import moment from 'moment';
import 'moment-timezone';

import { defaultTimeZone, timezones } from '@constants/app';
import { DefaultTimeZone } from '@constants/campaignBuilder';
import { CaptureException } from '@utils/error';

export interface TimezoneFormOptionObj {
  cityKey: string;
  timezoneDbName: string;
  title: string;
  value: number;
}

export const getLocalizedTimezoneTitle = (
  timezoneDbName: string,
  cityKey: string,
  locale: string,
  translate: (key: string) => string,
): string => {
  try {
    const zone = moment.tz.zone(timezoneDbName);
    if (!zone) {
      return timezoneDbName;
    }

    const offsetMinutes = -zone.utcOffset(Date.now());
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const mins = String(absMinutes % 60).padStart(2, '0');
    const offsetStr = `GMT ${sign}${hours}:${mins}`;

    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: timezoneDbName,
      timeZoneName: 'longGeneric',
    }).formatToParts(new Date());

    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;

    const cityRaw = translate(cityKey);
    // Soft fallback: if translation is missing, derive city from IANA path
    // so we never render the raw key string to the user.
    const cityName =
      cityRaw === cityKey
        ? (timezoneDbName.split('/').pop()?.replace(/_/g, ' ') ?? timezoneDbName)
        : cityRaw;

    return tzName ? `(${offsetStr}) ${cityName} - ${tzName}` : `(${offsetStr}) ${cityName}`;
  } catch {
    return timezoneDbName;
  }
};

export const getLocalizedTimezones = (
  locale: string,
  translate: (key: string) => string,
): TimezoneFormOptionObj[] =>
  timezones.map((tz) => ({
    ...tz,
    title: getLocalizedTimezoneTitle(tz.timezoneDbName, tz.cityKey, locale, translate),
  }));

export const getLocalizedDefaultTimeZone = (
  locale: string,
  translate: (key: string) => string,
): TimezoneFormOptionObj => ({
  ...defaultTimeZone,
  title: getLocalizedTimezoneTitle(
    defaultTimeZone.timezoneDbName,
    defaultTimeZone.cityKey,
    locale,
    translate,
  ),
});

const UNSUPPORTED_TZ_OBJECT: TimezoneFormOptionObj = {
  cityKey: '',
  timezoneDbName: '',
  title: 'LEGACY TIMEZONE - we no longer support this timezone',
  value: 0,
};

export const GetTimezoneObjFromEnum = (enumValue?: number): TimezoneFormOptionObj => {
  if (!enumValue) {
    return DefaultTimeZone;
  }

  const foundTimezoneObj = timezones.find(
    (tzObj: TimezoneFormOptionObj) => tzObj.value === enumValue,
  );

  if (foundTimezoneObj) {
    return foundTimezoneObj;
  }

  CaptureException(`Unsupported Timezone Enum Value ${enumValue}`);

  return UNSUPPORTED_TZ_OBJECT;
};

/**
 * Validates a timezone database name and returns it if valid, otherwise returns the default timezone.
 * @param rawTimezoneDbName - The timezone database name to validate (e.g., 'America/New_York')
 * @returns The validated timezone database name or the default timezone database name
 */
export const GetValidatedTimezoneDbName = (rawTimezoneDbName?: string): string => {
  if (rawTimezoneDbName && moment.tz.zone(rawTimezoneDbName)) {
    return rawTimezoneDbName;
  }
  return defaultTimeZone.timezoneDbName;
};

/** Resolves org `time_zone` enum to a validated IANA name for reporting and charts. */
export const getAdvertiserTimezoneDbName = (organizationTimeZoneEnum?: number): string =>
  GetValidatedTimezoneDbName(
    GetTimezoneObjFromEnum(organizationTimeZoneEnum ?? defaultTimeZone.value).timezoneDbName,
  );

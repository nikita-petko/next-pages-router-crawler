import moment from 'moment-timezone';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { REPORTING_TIMEZONE_DB_NAME } from '@constants/reportingStatsConstants';
import { GetValidatedTimezoneDbName } from '@utils/timezone';

export const FRONTEND_REPORTING_CAAS_START_DATE = '2025-01-01';

/**
 * Fallback period when CUSTOM is requested but the start/end dates are missing
 * or unparseable. Matches the picker's default preset in `newFlowStoreProvider`
 * so the chart window degrades to the same range the user would see on load.
 */
const CUSTOM_RANGE_FALLBACK_PERIOD = DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS;

interface AdvertiserTimeSeriesRange {
  endTime: Date;
  startTime: Date;
}

/**
 * Parse a YYYY-MM-DD date as a moment anchored to `zone`. Returns undefined
 * for missing or malformed input. Matches AMSv2
 * `ConvertDateFilteringOptionsToStartTimestamp` /
 * `GetEndTimestampForFilteringPredicate` and AMS advertiser-report-processor
 * `parseCutoverDate` — the string is not interpreted as UTC.
 */
const parseAdvertiserDay = (value: string | undefined, zone: string): moment.Moment | undefined => {
  if (!value) {
    return undefined;
  }
  const dayMoment = moment.tz(value, 'YYYY-MM-DD', true, zone);
  return dayMoment.isValid() ? dayMoment : undefined;
};

/**
 * Computes [startMoment, endMoment] in the advertiser timezone for the requested
 * period. Mirrors AMSv2 ConvertDateFilteringOptionsToStartTimestamp /
 * GetEndTimestampForFilteringPredicate so the chart's date window stays
 * consistent with the page-level summary stats.
 *
 * - TODAY: today midnight → now
 * - YESTERDAY: yesterday midnight → today midnight (exclusive)
 * - SEVEN_DAYS / THIRTY_DAYS: N-1 days back from today midnight → now
 * - THIS_MONTH: 1st of this month midnight → now
 * - LAST_MONTH: 1st of last month midnight → 1st of this month midnight (exclusive)
 * - YEAR_TO_DATE: Jan 1 this year midnight → now
 * - PREVIOUS_YEAR: Jan 1 last year midnight → Jan 1 this year midnight (exclusive)
 */
const getPeriodBoundsInAdvertiserTz = (
  requestMoment: moment.Moment,
  timePeriod: DateFilteringTimePeriod,
): { endMoment: moment.Moment; startMoment: moment.Moment } => {
  const todayStart = requestMoment.clone().startOf('day');
  const monthStart = requestMoment.clone().startOf('month');
  const yearStart = requestMoment.clone().startOf('year');

  switch (timePeriod) {
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY:
      return { endMoment: requestMoment.clone(), startMoment: todayStart };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY:
      return {
        endMoment: todayStart.clone(),
        startMoment: todayStart.clone().subtract(1, 'day'),
      };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS:
      return {
        endMoment: requestMoment.clone(),
        startMoment: todayStart.clone().subtract(6, 'days'),
      };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS:
      return {
        endMoment: requestMoment.clone(),
        startMoment: todayStart.clone().subtract(29, 'days'),
      };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH:
      return { endMoment: requestMoment.clone(), startMoment: monthStart };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH:
      return {
        endMoment: monthStart.clone(),
        startMoment: monthStart.clone().subtract(1, 'month'),
      };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE:
      return { endMoment: requestMoment.clone(), startMoment: yearStart };
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR:
      return {
        endMoment: yearStart.clone(),
        startMoment: yearStart.clone().subtract(1, 'year'),
      };
    // UNSPECIFIED, CUSTOM (short-circuited by caller), and any future enum
    // value fall through to a today-bound window rather than crashing.
    default:
      return { endMoment: requestMoment.clone(), startMoment: todayStart };
  }
};

interface AdvertiserTimeSeriesRangeOptions {
  customEndDate?: string;
  customStartDate?: string;
  unifiedAttributionCutoverDate?: string;
}

/**
 * Computes the chart query window in the advertiser calendar. Matches AMSv2
 * date-filtering semantics for the page-level DateQuickPick. When a unified-
 * attribution cutover date is configured and falls after the computed start,
 * the start is clamped to cutover midnight.
 */
export const getAdvertiserTimeSeriesRange = (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  timezoneDbName: string,
  {
    customEndDate,
    customStartDate,
    unifiedAttributionCutoverDate,
  }: AdvertiserTimeSeriesRangeOptions = {},
): AdvertiserTimeSeriesRange => {
  const zone = GetValidatedTimezoneDbName(timezoneDbName);
  const requestMoment = moment(requestTimestamp).tz(zone);
  const customStartMoment = parseAdvertiserDay(customStartDate, zone);
  const customEndMoment = parseAdvertiserDay(customEndDate, zone)?.endOf('day');
  const isCustom = timePeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
  // If CUSTOM was requested but either date is missing or unparseable, fall
  // back to the picker default rather than a today-only or half-open window.
  let { endMoment, startMoment } =
    isCustom && customStartMoment && customEndMoment
      ? { endMoment: customEndMoment, startMoment: customStartMoment }
      : getPeriodBoundsInAdvertiserTz(
          requestMoment,
          isCustom ? CUSTOM_RANGE_FALLBACK_PERIOD : timePeriod,
        );

  const cutoverStartMoment = parseAdvertiserDay(unifiedAttributionCutoverDate, zone);
  if (cutoverStartMoment?.isAfter(startMoment)) {
    startMoment = cutoverStartMoment;
  }
  // Defensive: if the cutover pushed the start past the end (e.g. YESTERDAY +
  // a future cutover), clamp end to start to avoid an inverted window.
  if (startMoment.isAfter(endMoment)) {
    endMoment = startMoment.clone();
  }

  return {
    endTime: endMoment.toDate(),
    startTime: startMoment.toDate(),
  };
};

/**
 * Computes the query window for frontend reporting's ByUniverse CaaS metrics.
 * These metrics are complete from 2025-01-01 and do not use the temporary
 * unified-attribution cutover applied to the legacy ad-account query path.
 */
export const getFrontendReportingTimeSeriesRange = (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
): AdvertiserTimeSeriesRange =>
  getAdvertiserTimeSeriesRange(requestTimestamp, timePeriod, REPORTING_TIMEZONE_DB_NAME, {
    unifiedAttributionCutoverDate: FRONTEND_REPORTING_CAAS_START_DATE,
  });

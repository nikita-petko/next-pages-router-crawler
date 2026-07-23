import moment from 'moment-timezone';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { GetValidatedTimezoneDbName } from '@utils/timezone';

const CUTOVER_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface AdvertiserTimeSeriesRange {
  endTime: Date;
  startTime: Date;
}

/**
 * Start of the unified-attribution cutover calendar day at midnight in the
 * advertiser timezone (YYYY-MM-DD). Matches AMS advertiser-report-processor
 * parseCutoverDate — the date string is not interpreted as UTC.
 */
const getCutoverStartMoment = (
  unifiedAttributionCutoverDate: string | undefined,
  timezoneDbName: string,
): moment.Moment | undefined => {
  if (!unifiedAttributionCutoverDate) {
    return undefined;
  }

  const match = CUTOVER_DATE_PATTERN.exec(unifiedAttributionCutoverDate.trim());
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1; // Moment.js expects months to be 0-11
  const day = Number(match[3]);
  const zone = GetValidatedTimezoneDbName(timezoneDbName);
  const cutoverMoment = moment.tz(zone).year(year).month(month).date(day).startOf('day');

  return cutoverMoment.isValid() ? cutoverMoment : undefined;
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
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED:
    default:
      return { endMoment: requestMoment.clone(), startMoment: todayStart };
  }
};

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
  unifiedAttributionCutoverDate?: string,
): AdvertiserTimeSeriesRange => {
  const zone = GetValidatedTimezoneDbName(timezoneDbName);
  const requestMoment = moment(requestTimestamp).tz(zone);
  let { endMoment, startMoment } = getPeriodBoundsInAdvertiserTz(requestMoment, timePeriod);

  const cutoverStartMoment = getCutoverStartMoment(unifiedAttributionCutoverDate, timezoneDbName);
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

import { ServerPaymentType } from '@constants/campaign';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import ReportingStatType from '@constants/reportingStatsConstants';

function formatNumberToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

const END_USER_AD_CREDIT_UNIT = 'Ad Credit';
const END_USER_CARD_UNIT = 'USD';
const TRUNCATE_VALUE_THRESHOLD_THOUSANDS = 1000;
const TRUNCATE_VALUE_THRESHOLD_MILLIONS = 1000000;
const TRUNCATE_VALUE_THRESHOLD_BILLIONS = 1000000000;
const TRUNCATE_VALUE_THRESHOLD_TRILLIONS = 1000000000000;

const getEndUserPaymentUnit = (paymentType: ServerPaymentType) => {
  switch (paymentType) {
    case ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT:
      return END_USER_AD_CREDIT_UNIT;
    case ServerPaymentType.PAYMENT_TYPE_CARD:
    case ServerPaymentType.PAYMENT_TYPE_INVOICE:
      return END_USER_CARD_UNIT;
    default:
      return '';
  }
};

const getStatString = (reportingStatType: ReportingStatType, value: number | undefined) => {
  let valueString = UNAVAILABLE_VALUE_DISPLAY;
  // Most stats treat 0 as unavailable. ROAS keeps 0 so spend-with-no-revenue
  // can render as "0.00" (missing ROAS is undefined upstream).
  if (
    value == null ||
    Number.isNaN(value) ||
    (value === 0 && reportingStatType !== ReportingStatType.REPORTING_STAT_ROAS)
  ) {
    return valueString;
  }
  switch (reportingStatType) {
    case ReportingStatType.REPORTING_STAT_IMPRESSIONS:
    case ReportingStatType.REPORTING_STAT_CLICKS:
    case ReportingStatType.REPORTING_STAT_PLAYS:
    case ReportingStatType.REPORTING_STAT_TOTAL_ROBUX_REVENUE_30D:
      if (Number.isInteger(value)) {
        valueString = value.toLocaleString('en-US');
      }
      break;
    case ReportingStatType.REPORTING_STAT_TOTAL_PLAY_TIME_7D:
      valueString = value.toLocaleString('en-US', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      });
      break;
    case ReportingStatType.REPORTING_STAT_SPEND:
    case ReportingStatType.REPORTING_STAT_ROAS:
      // ROAS is a unitless ratio (robux revenue / spend USD). No multiplier suffix.
      valueString = value.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
      break;
    case ReportingStatType.REPORTING_STAT_COST_PER_PLAY:
      valueString = value.toLocaleString('en-US', {
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
      });
      break;
    case ReportingStatType.REPORTING_STAT_CLICK_THROUGH_RATE:
      valueString = `${value}%`;
      break;
    default: {
      // Enforces exhaustive switch for all ReportingStatType values
      const unhandledType: never = reportingStatType;
      throw new Error(`Unhandled type for item: ${unhandledType}`);
    }
  }
  return valueString;
};

// For values in table rows, some need USD or Ad Credit appended
export const GetTableDisplayValue = ({
  isReportingDisabled,
  paymentType,
  reportingStatType: reportingStatsType,
  value,
}: {
  isReportingDisabled?: boolean;
  paymentType?: ServerPaymentType;
  reportingStatType: ReportingStatType;
  value: number | undefined;
}) => {
  if (isReportingDisabled) {
    return UNAVAILABLE_VALUE_DISPLAY;
  }
  // Missing data → em-dash. For most stats, 0 is also treated as missing (no
  // activity). ROAS is an exception: AMSv2 sets 0.0 when there is spend but no
  // revenue, and leaves the field unset when ROAS is unknown — so only
  // nullish/NaN means unavailable for that metric.
  if (
    value == null ||
    Number.isNaN(value) ||
    (value === 0 && reportingStatsType !== ReportingStatType.REPORTING_STAT_ROAS)
  ) {
    return UNAVAILABLE_VALUE_DISPLAY;
  }
  const valueString = getStatString(reportingStatsType, value);
  if (paymentType) {
    const unit = getEndUserPaymentUnit(paymentType);
    return `${valueString} ${unit}`;
  }
  return valueString;
};

// For values in summary cards, we truncate values >= TRUNCATE_VALUE_THRESHOLD_UNIT
// For example, 10,000 is truncated to 10k
export const GetSummaryCardDisplayValue = (
  reportingStatType: ReportingStatType,
  value: number | undefined,
) => {
  if (value && value >= TRUNCATE_VALUE_THRESHOLD_TRILLIONS) {
    const numInUnits = formatNumberToOneDecimal(value / TRUNCATE_VALUE_THRESHOLD_TRILLIONS);
    return `${numInUnits}t`;
  }

  if (value && value >= TRUNCATE_VALUE_THRESHOLD_BILLIONS) {
    const numInUnits = formatNumberToOneDecimal(value / TRUNCATE_VALUE_THRESHOLD_BILLIONS);
    return `${numInUnits}b`;
  }

  if (value && value >= TRUNCATE_VALUE_THRESHOLD_MILLIONS) {
    const numInUnits = formatNumberToOneDecimal(value / TRUNCATE_VALUE_THRESHOLD_MILLIONS);
    return `${numInUnits}m`;
  }

  if (value && value >= TRUNCATE_VALUE_THRESHOLD_THOUSANDS) {
    const numInUnits = formatNumberToOneDecimal(value / TRUNCATE_VALUE_THRESHOLD_THOUSANDS);
    return `${numInUnits}k`;
  }

  return getStatString(reportingStatType, value);
};

export const GetCPPFallbackValue = (paymentType?: ServerPaymentType) => {
  const valueString = '<0.001';
  if (paymentType) {
    const unit = getEndUserPaymentUnit(paymentType);
    return `${valueString} ${unit}`;
  }
  return valueString;
};

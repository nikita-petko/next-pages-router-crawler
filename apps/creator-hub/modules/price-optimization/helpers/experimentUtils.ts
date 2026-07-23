import { ExperimentMetric, ExperimentState } from '@rbx/clients/priceExperimentationApi/v1';
import {
  MICRO_MULTIPLE,
  OVERALL_REVENUE_METRIC_NAME,
  TESTED_PRODUCTS_REVENUE_METRIC_NAME,
} from '../constants/metricsMetadata';

/**
 * @param experimentState
 * @returns Whether the experiment is complete (including if it has moved onto the holdout stage)
 */
export const isInitialExperimentComplete = (experimentState?: ExperimentState): boolean => {
  if (!experimentState) {
    return false;
  }

  return (
    experimentState === ExperimentState.ResultsReady ||
    experimentState === ExperimentState.HoldoutRunning ||
    experimentState === ExperimentState.HoldoutCompleting ||
    experimentState === ExperimentState.HoldoutCompleted ||
    experimentState === ExperimentState.PriceRevertingWithCompletion ||
    experimentState === ExperimentState.PriceReverted ||
    experimentState === ExperimentState.Completed
  );
};

export const isInHoldoutState = (experimentState?: ExperimentState): boolean => {
  if (!experimentState) {
    return false;
  }

  return (
    experimentState === ExperimentState.HoldoutRunning ||
    experimentState === ExperimentState.HoldoutCompleting ||
    experimentState === ExperimentState.HoldoutCompleted ||
    experimentState === ExperimentState.PriceRevertingWithCompletion ||
    experimentState === ExperimentState.PriceReverted
  );
};

/**
 * @param experimentState
 * @returns Whether experiment is in a polling state
 */
export const isExperimentPolling = (experimentState?: ExperimentState): boolean => {
  if (!experimentState) {
    return false;
  }

  return (
    experimentState === ExperimentState.PriceRevertingWithCompletion ||
    experimentState === ExperimentState.HoldoutCompleting
  );
};

/**
 * @param experimentState
 * @returns Whether the experiment is ongoing/active (excludes completed, failed, cancelled, and unstarted experiments)
 */
export const isOngoingExperiment = (experimentState?: ExperimentState): boolean => {
  if (!experimentState) {
    return false;
  }

  return (
    experimentState !== ExperimentState.Completed &&
    experimentState !== ExperimentState.Failed &&
    experimentState !== ExperimentState.Cancelled &&
    experimentState !== ExperimentState.Created
  );
};

export const isInHoldoutResultsState = (experimentState?: ExperimentState): boolean => {
  if (!experimentState) {
    return false;
  }

  return (
    experimentState === ExperimentState.HoldoutCompleted ||
    experimentState === ExperimentState.PriceReverted ||
    experimentState === ExperimentState.PriceRevertingWithCompletion
  );
};

export const extractHoldoutResults = (holdoutMetrics: ExperimentMetric[]) => {
  const testedProductsRevenueMetric = holdoutMetrics.find(
    (metric) => metric.name === TESTED_PRODUCTS_REVENUE_METRIC_NAME,
  );
  const overallRevenueMetric = holdoutMetrics.find(
    (metric) => metric.name === OVERALL_REVENUE_METRIC_NAME,
  );
  if (!testedProductsRevenueMetric || !overallRevenueMetric) {
    return {
      testedProductsRevenue: null,
      overallRevenue: null,
      isStatisticallySignificant: false,
    };
  }

  const testedProductsRevenue = testedProductsRevenueMetric.valueInMicroUnits / MICRO_MULTIPLE;
  const overallRevenue = overallRevenueMetric.valueInMicroUnits / MICRO_MULTIPLE;
  const isStatisticallySignificant =
    testedProductsRevenueMetric.isStatisticallySignificant &&
    overallRevenueMetric.isStatisticallySignificant;
  return { testedProductsRevenue, overallRevenue, isStatisticallySignificant };
};

/**
 * Checks and matches the given TimeSpan string against the C# invariant TimeSpan format.
 *
 * @param timeSpan - The TimeSpan string to check.
 * @returns The match result or null if the string does not match the format.
 */
const matchTimeSpan = (timeSpan: string): RegExpMatchArray | null => {
  const regex = /^(-)?(?:(\d+)\.)?(\d\d):(\d\d):(\d\d)(?:\.(\d{1,7}))?$/;
  return timeSpan.match(regex);
};

/**
 * Parses the matched TimeSpan components into total seconds.
 *
 * @param match - The match result from the regex.
 * @returns The total seconds represented by the TimeSpan.
 */
const parseTimeSpanToSeconds = (match: RegExpMatchArray): number => {
  const sign = match[1] ? -1 : 1;
  const days = match[2] ? parseInt(match[2], 10) : 0;
  const hours = parseInt(match[3], 10);
  const minutes = parseInt(match[4], 10);
  const seconds = parseInt(match[5], 10);
  const fraction = match[6] ? parseFloat(`0.${match[6]}`) : 0;

  // 1 day = 86400 seconds, 1 hour = 3600 seconds, 1 minute = 60 seconds.
  return sign * (days * 86400 + hours * 3600 + minutes * 60 + seconds + fraction);
};

/**
 * Converts a C# invariant TimeSpan string (format: [-][d'.']hh':'mm':'ss['.'fffffff])
 * to a number of weeks (rounded to the nearest integer).
 *
 * @param timeSpan - The TimeSpan string to convert (e.g. "00:05:00" for 5 minutes).
 * @param isHoldout - Flag used to determine fallback value if parsing fails.
 * @returns The number of weeks represented by the timespan.
 */
export const convertTimeSpanToWeeks = (timeSpan: string | null, isHoldout: boolean): string => {
  // Fallback values if input is null/empty.
  if (!timeSpan) {
    return isHoldout ? '4' : '2';
  }

  const match = matchTimeSpan(timeSpan);

  if (!match) {
    return isHoldout ? '4' : '2';
  }

  const totalSeconds = parseTimeSpanToSeconds(match);

  // 1 week = 7 days, and 1 day = 86400 seconds.
  const weeks = totalSeconds / (7 * 86400);

  return String(Math.round(weeks));
};

/**
 * Converts a C# invariant TimeSpan string (format: [-][d'.']hh':'mm':'ss['.'fffffff])
 * to a number of days (rounded to the nearest integer).
 *
 * @param timeSpan - The TimeSpan string to convert (e.g. "00:05:00" for 5 minutes).
 * @param isHoldout - Flag used to determine fallback value if parsing fails.
 * @returns The number of days represented by the timespan.
 */
export const convertTimeSpanToDays = (timeSpan: string | null, isHoldout: boolean): number => {
  // Fallback values if input is null/empty.
  if (!timeSpan) {
    return isHoldout ? 28 : 16;
  }

  const match = matchTimeSpan(timeSpan);

  if (!match) {
    return isHoldout ? 28 : 16;
  }

  const totalSeconds = parseTimeSpanToSeconds(match);

  // 1 day = 86400 seconds.
  const totalDays = totalSeconds / 86400;

  return Math.round(totalDays);
};

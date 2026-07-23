import {
  BudgetType,
  type GetPerformanceEstimateRequest,
  type GetPerformanceEstimateResponse,
  PerformanceEstimateRequestType,
} from '@rbx/client-ads-management-api/v1';

import { MicroUsdToUsd, MicroUsdToUsdString, UsdToMicroUsd } from '@utils/currency';

export type ForecastDurationValue = 'continuous' | '7' | '10' | '14';

export const CONTINUOUS_DURATION_VALUE: ForecastDurationValue = 'continuous';

export const FORECAST_DURATION_DAYS_OPTIONS = [7, 10, 14] as const;

export type ForecastFormInputs = {
  budgetUsd: string;
  durationInDays: ForecastDurationValue;
  plays: string;
};

export const initialForecastFormInputs: ForecastFormInputs = {
  budgetUsd: '',
  durationInDays: CONTINUOUS_DURATION_VALUE,
  plays: '',
};

export type EstimateDisplay = {
  dailyBudgetMicroUsd: number;
  dailyPlays: number;
  isContinuous: boolean;
  primaryBudgetMicroUsd: number;
  primaryPlays: number;
};

export const isForecastDurationContinuous = (duration: ForecastDurationValue): boolean =>
  duration === CONTINUOUS_DURATION_VALUE;

export const scaleDailyLimitByCampaignDuration = (
  dailyAmount: number,
  duration: ForecastDurationValue,
): number => {
  if (isForecastDurationContinuous(duration)) {
    return dailyAmount;
  }
  return dailyAmount * Number.parseInt(duration, 10);
};

export const formatCppDisplay = (microUsd: number): string =>
  MicroUsdToUsd(microUsd).toLocaleString('en-US', {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  });

export const formatForecastBudgetMicroUsd = (microUsd: number): string =>
  `$${MicroUsdToUsdString(microUsd)}`;

export const formatForecastPlays = (plays: number): string => plays.toLocaleString('en-US');

export const getEstimateDisplayFromResponse = (
  res: GetPerformanceEstimateResponse,
  duration: ForecastDurationValue,
): EstimateDisplay => {
  const isContinuous = isForecastDurationContinuous(duration);

  return {
    dailyBudgetMicroUsd: res.dailyBudgetMicroUsd,
    dailyPlays: res.dailyPlays,
    isContinuous,
    primaryBudgetMicroUsd: isContinuous
      ? res.dailyBudgetMicroUsd
      : (res.lifetimeBudgetMicroUsd ?? 0),
    primaryPlays: isContinuous ? res.dailyPlays : (res.lifetimePlays ?? 0),
  };
};

export const buildPerformanceEstimateRequestBody = (
  budgetUsd: string,
  plays: string,
  durationInDays: ForecastDurationValue,
): GetPerformanceEstimateRequest => {
  const budgetTrim = budgetUsd.trim();
  const playsTrim = plays.trim();
  const usd = Number.parseFloat(budgetTrim);
  const playsN = Number(playsTrim);
  const useBudget = budgetTrim.length > 0 && Number.isFinite(usd) && usd > 0;

  const body: GetPerformanceEstimateRequest = {
    budgetType: isForecastDurationContinuous(durationInDays)
      ? BudgetType.BudgetType_BUDGET_TYPE_DAILY
      : BudgetType.BudgetType_BUDGET_TYPE_LIFETIME,
    durationInDays: isForecastDurationContinuous(durationInDays)
      ? 0
      : Number.parseInt(durationInDays, 10),
    requestType: useBudget
      ? PerformanceEstimateRequestType.PerformanceEstimateRequestTypeBudget
      : PerformanceEstimateRequestType.PerformanceEstimateRequestTypePlays,
  };

  if (useBudget) {
    body.budgetMicroUsd = UsdToMicroUsd(usd);
  } else {
    body.plays = playsN;
  }

  return body;
};

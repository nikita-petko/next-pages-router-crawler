import type { CSSProperties } from 'react';
import type { UseTranslationResult } from '@rbx/intl';
import type { TTheme } from '@rbx/ui';
import { getResponseFromError } from '@modules/clients/utils';
import {
  PayoutColorTypeToHexMap,
  SupportedPayoutColorTypes,
  chartLabelMaxLength,
  violationLabels,
} from '../constants/payoutsConstants';
import type { PayoutMetadata } from '../hooks/useUserOptionsForGroupMembersEligibleForPayout';
import type { OneTimePayoutBase, OneTimePayoutBaseV2 } from '../interface/OneTimePayoutFormType';
import type PayoutColorType from '../interface/PayoutColorType';

export function isPayoutMetadata(metadata: unknown): metadata is PayoutMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  return 'amount' in metadata && 'createdAt' in metadata;
}

export const getPayoutStyle = (
  payoutColor: PayoutColorType,
  property: 'fill' | 'background' = 'fill',
): CSSProperties => {
  const hex = PayoutColorTypeToHexMap.get(payoutColor);
  return {
    [property]: `#${hex}`,
  };
};

export const getRandomPayoutColorType = (): PayoutColorType => {
  const randomIndex = Math.floor(Math.random() * SupportedPayoutColorTypes.length);
  return SupportedPayoutColorTypes[randomIndex];
};

export const getNextColor = (colorsInUse: PayoutColorType[]): PayoutColorType => {
  const useRandomColor = colorsInUse.length >= SupportedPayoutColorTypes.length; // If all colors are in use, use a random color
  if (useRandomColor) {
    return getRandomPayoutColorType();
  }

  const availableColors = SupportedPayoutColorTypes.filter((color) => !colorsInUse.includes(color));
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randomIndex];
};

export const validateNumberInput = (input: string): boolean => {
  if (input === '') {
    return true;
  }

  if (Number.isNaN(input)) {
    return false;
  }

  const parsedInput = Number(input);
  // integer between 0 and 100
  return Number.isInteger(parsedInput) && parsedInput >= 0 && parsedInput <= 100;
};

// validate payouts <= 100
export const validatePayoutAmountsLessThanOrEqualTo100 = (payoutAmounts: number[]): boolean => {
  const nonGroupPayoutSum =
    payoutAmounts.length === 0 ? 0 : payoutAmounts.reduce((sum, curr) => sum + curr);

  return nonGroupPayoutSum <= 100;
};

export const validatePositiveIntegerInput = (input: string): boolean => {
  const parsedInput = Number(input);

  return input === '' || (Number.isInteger(parsedInput) && parsedInput >= 0);
};

export const calculatePayoutsTotal = (
  payouts: OneTimePayoutBase[] | OneTimePayoutBaseV2[],
): number => {
  if (!payouts || payouts.length === 0) {
    return 0;
  }
  return payouts.reduce((sum, payout) => {
    const amount = Number.parseInt(payout.amount, 10);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
};

export const validateTotalGroupPayoutSum = (
  payouts: OneTimePayoutBase[] | OneTimePayoutBaseV2[],
  groupFunds?: number,
): boolean => {
  if (groupFunds === undefined) {
    return true;
  }

  return calculatePayoutsTotal(payouts) <= groupFunds;
};

export const validateAllPayoutsNonZero = (
  payouts: OneTimePayoutBase[] | OneTimePayoutBaseV2[],
): boolean => {
  return payouts.every((payout) => Number.parseInt(payout.amount, 10) > 0);
};

type TPayoutChartThemedColors = {
  background: string;
  accordionBackground: string;
  tooltipText: string;
};

export const getPayoutChartThemedColors = (theme: TTheme): TPayoutChartThemedColors => {
  return {
    background: theme.palette.surface[0],
    accordionBackground: theme.palette.surface[300],
    tooltipText: theme.palette.content.standard,
  };
};

export const truncateString = (str: string) => {
  return str.length > chartLabelMaxLength ? `${str.slice(0, chartLabelMaxLength).trim()}...` : str;
};

type TTranslate = UseTranslationResult['translate'];

export type EconomicRestrictionInfo = {
  failureReason: string;
  expirationTimeInMinutes: number;
};

type EconomicRestrictionErrorResponse = {
  [key in keyof EconomicRestrictionInfo as Capitalize<key>]: EconomicRestrictionInfo[key];
};

export function isEconomicRestrictionError(
  response: unknown,
): response is EconomicRestrictionErrorResponse {
  if (response == null || typeof response !== 'object') {
    return false;
  }
  return (
    'FailureReason' in response &&
    response.FailureReason !== undefined &&
    'ExpirationTimeInMinutes' in response &&
    response.ExpirationTimeInMinutes !== undefined
  );
}

export async function tryParseEconomicRestrictionError(
  err: unknown,
): Promise<EconomicRestrictionInfo | null> {
  try {
    const response = getResponseFromError(err);

    if (response?.status !== 403) {
      return null;
    }

    const body: unknown = await response.json();

    const isRestriction = isEconomicRestrictionError(body);

    if (isRestriction) {
      const restrictionInfo: EconomicRestrictionInfo = {
        failureReason: body.FailureReason,
        expirationTimeInMinutes: body.ExpirationTimeInMinutes,
      };
      return restrictionInfo;
    }

    return null;
  } catch {
    return null;
  }
}

export const getEconomicRestrictionErrorMsg = (
  translate: TTranslate,
  violation: string,
  timeoutDurationInMinutes: number,
): string => {
  const timeoutInHours = Math.ceil(timeoutDurationInMinutes / 60);
  if (timeoutInHours > 24) {
    const timeoutInDays = Math.ceil(timeoutInHours / 24);
    return translate('Text.EconomicRestrictionsDaysGeneral', {
      violation: translate(violationLabels[violation] ?? 'Label.Sublabel.FraudPaymentAbuse'),
      day: String(timeoutInDays),
    });
  }
  return translate('Text.EconomicRestrictionsHoursGeneral', {
    violation: translate(violationLabels[violation] ?? 'Label.Sublabel.FraudPaymentAbuse'),
    hour: String(timeoutInHours),
  });
};

export default {
  isPayoutMetadata,
  getPayoutStyle,
  getRandomPayoutColorType,
  getNextColor,
  validateNumberInput,
  validatePayoutAmountsLessThanOrEqualTo100,
  validatePositiveIntegerInput,
  validateTotalGroupPayoutSum,
  validateAllPayoutsNonZero,
  calculatePayoutsTotal,
  getPayoutChartThemedColors,
  truncateString,
  getEconomicRestrictionErrorMsg,
};

import type { RobloxMarketplaceFiatSharedV1Beta1Money as Money } from '@rbx/client-marketplace-fiat-service/v1';
import type { GetRequirementsResponse } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { Role } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import type { Locale } from '@rbx/intl';
import { Asset } from '@modules/miscellaneous/common';

export const transformToBaseTenAndRound = (
  significand: number,
  exponent: number,
  roundToDecimalPlace: number,
): number => {
  const result = significand * 10 ** exponent;
  return Number(result.toFixed(roundToDecimalPlace));
};

const validateMoney = (money: Money) => {
  if (
    money === undefined ||
    money.quantity?.significand === undefined ||
    money.quantity?.significand === null ||
    money.quantity?.exponent === undefined ||
    money.quantity === undefined ||
    !money.currencyCode
  ) {
    throw new Error(`Invalid money: ${JSON.stringify(money)}`);
  }
};

const alignExponents = (
  significand1: number,
  exponent1: number,
  significand2: number,
  exponent2: number,
): { significand1: number; significand2: number; exponent: number } => {
  if (exponent1 === exponent2) {
    return {
      significand1,
      significand2,
      exponent: exponent1,
    };
  }

  const exponentDifference = exponent1 - exponent2;

  if (exponentDifference > 0) {
    return {
      significand1,
      significand2: significand2 * 10 ** -exponentDifference,
      exponent: exponent1,
    };
  }
  return {
    significand1: significand1 * 10 ** exponentDifference,
    significand2,
    exponent: exponent2,
  };
};

export const addMoney = (money1: Money, money2: Money): Money => {
  validateMoney(money1);
  validateMoney(money2);

  if (money1.currencyCode !== money2.currencyCode) {
    throw new Error('Cannot add money with different currencies');
  }

  const { significand1, significand2, exponent } = alignExponents(
    Number(money1.quantity?.significand),
    Number(money1.quantity?.exponent),
    Number(money2.quantity?.significand),
    Number(money2.quantity?.exponent),
  );

  const summedSignificand = significand1 + significand2;

  return {
    quantity: {
      significand: summedSignificand,
      exponent,
    },
    currencyCode: money1.currencyCode,
  };
};

export const getPriceDisplayStringFromMoney = (money: Money, locale: Locale | null) => {
  validateMoney(money);

  const price = transformToBaseTenAndRound(
    Number(money.quantity?.significand),
    Number(money.quantity?.exponent),
    2,
  );

  return price.toLocaleString(locale?.toString(), {
    style: 'currency',
    currency: money.currencyCode ?? undefined,
  });
};

export const isFiatPriceStringPriced = (fiatPriceString: string | undefined): boolean => {
  if (!fiatPriceString) {
    return false;
  }
  const fiatPrice = JSON.parse(fiatPriceString) as Money;
  return fiatPrice?.quantity?.significand ? Number(fiatPrice.quantity.significand) > 0 : false;
};

export const isDataSharingAvailableForAssetType = (assetType: Asset): boolean => {
  switch (assetType) {
    case Asset.Model:
    case Asset.MeshPart:
    case Asset.Decal:
      return true;
    default:
      return false;
  }
};

export const isDataSharingAvailableForPriceString = (
  fiatPriceString: string | undefined,
): boolean => {
  if (!fiatPriceString) {
    return false;
  }
  const fiatPrice = JSON.parse(fiatPriceString) as Money;
  return fiatPrice?.quantity?.significand ? Number(fiatPrice.quantity.significand) > 0 : false;
};

export const isDataSharingAvailableForRoles = (roles: Role[]): boolean => {
  return !roles.includes(Role.Reseller);
};

export enum DataSharingDisplayState {
  NotApplicable,
  FairUseGeneric,
  FairUseReseller,
  Configurable,
}

export const getDataSharingDisplayState = (
  assetType: Asset,
  isDataSharingEligible: boolean,
  isItemDistributedValue: boolean,
  fiatPriceValue: string,
  assetConfigurationRequirements: GetRequirementsResponse,
): DataSharingDisplayState => {
  if (!isDataSharingEligible) {
    return DataSharingDisplayState.NotApplicable;
  }
  if (!isDataSharingAvailableForAssetType(assetType) || !isItemDistributedValue) {
    return DataSharingDisplayState.NotApplicable;
  }
  if (!isDataSharingAvailableForPriceString(fiatPriceValue)) {
    return DataSharingDisplayState.FairUseGeneric;
  }
  if (!isDataSharingAvailableForRoles(assetConfigurationRequirements?.roles?.roles ?? [])) {
    return DataSharingDisplayState.FairUseReseller;
  }
  return DataSharingDisplayState.Configurable;
};

export const FREE_BASE_PRICE = {
  currencyCode: 'USD',
  quantity: {
    significand: 0,
    exponent: 0,
  },
};

import Big from 'big.js';
import { toInteger } from 'lodash';

export const MICRO_USD_IN_USD = 1000000;

export const MicroUsdToUsd = (microUsdAmt: number) => microUsdAmt / MICRO_USD_IN_USD;

export const UsdToString = (usdAmt: number) =>
  usdAmt.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

export const MicroUsdToUsdString = (microUsdAmt: number) => UsdToString(MicroUsdToUsd(microUsdAmt));

export const MicroUsdToUsdStringRoundedDown = (microUsdAmt: number) => {
  const usdAmt = MicroUsdToUsd(microUsdAmt);
  const roundedUsdAmt = Math.floor(usdAmt * 100) / 100;
  return UsdToString(roundedUsdAmt);
};

export const MicroUsdToUsdStringRoundedDownNoDecimals = (microUsdAmt: number) => {
  const usdAmt = MicroUsdToUsd(microUsdAmt);
  const roundedUsdAmt = Math.floor(usdAmt);
  return roundedUsdAmt.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

export const MicroUsdToUsdStringRoundedUp = (microUsdAmt: number) => {
  const usdAmt = MicroUsdToUsd(microUsdAmt);
  const roundedUsdAmt = Math.ceil(usdAmt * 100) / 100;
  return UsdToString(roundedUsdAmt);
};

export const MicroUsdToUsdStringRoundedUpNoDecimals = (microUsdAmt: number) => {
  const usdAmt = MicroUsdToUsd(microUsdAmt);
  const roundedUsdAmt = Math.ceil(usdAmt);
  return roundedUsdAmt.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

export const UsdToMicroUsd = (usdAmt: number) => {
  const amt = new Big(usdAmt.toString());
  const ratio = new Big(MICRO_USD_IN_USD);
  return toInteger(amt.times(ratio));
};

const roundDownToTwoDecimalPlaces = (num: number): number => Math.floor(num * 100) / 100;

export const NumberToCommaSeparatedWithTwoDecimalPlacesString = (num: number) =>
  roundDownToTwoDecimalPlaces(num).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

// We ran into an issue where $79.99 rounded up to $80 with the native javascript toFixed
// https://stackoverflow.com/questions/4187146/truncate-number-to-two-decimal-places-without-rounding
export const ToFixedNoRounding = (num: number | string, fixed: number) => {
  if (typeof num === 'number') {
    // eslint-disable-next-line no-useless-escape
    const re = new RegExp(`^-?\\d+(?:\.\\d{0,${fixed || -1}})?`);
    // @ts-ignore Object is possibly 'null'.
    return num.toString()!.match(re)[0];
  }
  return parseInt(num, 10).toFixed(fixed);
};

export const NumberToCommaSeparatedWithDecimalString = (num: number) =>
  ToFixedNoRounding(num, 2)!.replace(/\d(?=(\d{3})+\.)/g, '$&,');

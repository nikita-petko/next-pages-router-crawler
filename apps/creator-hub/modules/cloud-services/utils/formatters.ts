import type { Money } from '@rbx/client-service-efficiency-api/v1';
import { Locale } from '@rbx/intl';

export function currencyNumberFormatter(amount: number, decimal = 2): string {
  const formattedNumber = amount.toFixed(decimal);
  const trimmedNumber = formattedNumber.replace(/\.?0+$/, '');
  const [integerPart, decimalPart = ''] = trimmedNumber.split('.');
  const paddedDecimalPart = decimalPart.padEnd(2, '0');
  return decimalPart ? `$${integerPart}.${paddedDecimalPart}` : `$${integerPart}.00`;
}

const NANOS_DIVIDER = 1000000000;
export function moneyToNumber(money: Money): number {
  if (typeof money?.units !== 'undefined' && typeof money?.nanos !== 'undefined') {
    return money.units + money.nanos / NANOS_DIVIDER;
  }
  if (typeof money?.units !== 'undefined') {
    return money.units;
  }
  if (typeof money?.nanos !== 'undefined') {
    return money.nanos / NANOS_DIVIDER;
  }
  return Number.NaN;
}

export function currencyMoneyFormatter(money: Money, decimal = 2, multiplier = 1): string {
  return currencyNumberFormatter(moneyToNumber(money) * multiplier, decimal);
}

export function isValidMoneyString(moneyString: string): boolean {
  const numberRegex = /^(?!0\d)\d*(?:\.\d{1,2})?$/;
  return numberRegex.test(moneyString);
}

export const MAX_MONEY_BUDGET_USD = 99999.99;
export const MONEY_INPUT_PATTERN = /^\d*\.?\d{0,2}$/;

export function numberFormatter(amount: number): string {
  return amount.toLocaleString();
}

export function stringToMoney(input: string, currency = 'USD'): Money {
  if (!isValidMoneyString(input)) {
    throw new Error(`${input} is not a valid money string`);
  }
  const [unitsString, nanosString] = input.split('.');
  const units = Number(unitsString);
  // NOTE: tried to use subtraction to get nanos, but ts has issue on decimal calculation.
  // ex. 123.4 - 123 = 0.4000000000000057
  const nanos = typeof nanosString === 'undefined' ? 0 : Number(`.${nanosString}`) * NANOS_DIVIDER;
  return {
    currencyCode: currency,
    units,
    nanos,
  };
}

export function dateFormatter(date: Date, locale: Locale | null): string {
  return new Intl.DateTimeFormat(locale ?? Locale.English, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

import { Locale, useLocalization } from '@rbx/intl';
import type { Money } from '@modules/clients/commerce';
import { useCallback } from 'react';

const NANO = 1e-9;

const moneyToNumber = (money: Money): number => {
  if (typeof money?.units !== 'undefined' && typeof money?.nanos !== 'undefined') {
    return money.units + money.nanos * NANO;
  }
  if (typeof money?.units !== 'undefined') {
    return money.units;
  }
  if (typeof money?.nanos !== 'undefined') {
    return money.nanos * NANO;
  }
  return Number.NaN;
};

const useFormatters = () => {
  const locale = useLocalization().locale ?? Locale.English;

  const formatPrice = useCallback(
    (money: Money, decimalPlaces = 2) => {
      const amount = moneyToNumber(money);

      const priceFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: money.currencyCode,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      return priceFormatter.format(amount);
    },
    [locale],
  );

  const formatPercentage = useCallback(
    (money: Money) => {
      const amount = moneyToNumber(money) / 100;
      const percentageFormatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      return percentageFormatter.format(amount);
    },
    [locale],
  );

  return {
    formatPrice,
    formatPercentage,
  };
};

export default useFormatters;

import { useCallback } from 'react';
import type { RobloxPaidAccessFiatPaidAccessServiceV1Money as Money } from '@rbx/client-fiat-paid-access-service/v1';
import { Locale, useLocalization } from '@rbx/intl';

const NANO = 1e-9;

const moneyToNumber = (money: Money | undefined): number => {
  const units = Number(money?.units);
  const nanos = Number(money?.nanos);
  if (typeof money?.units !== 'undefined' && typeof money?.nanos !== 'undefined') {
    return units + nanos * NANO;
  }
  if (typeof money?.units !== 'undefined') {
    return units;
  }
  if (typeof money?.nanos !== 'undefined') {
    return nanos * NANO;
  }
  return Number.NaN;
};

const useFormatters = () => {
  const locale = useLocalization().locale ?? Locale.English;

  const formatPrice = useCallback(
    (money: Money | undefined, decimalPlaces = 2) => {
      const amount = moneyToNumber(money);

      const priceFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: money?.currencyCode ?? 'USD',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      return priceFormatter.format(amount);
    },
    [locale],
  );

  return {
    formatPrice,
  };
};

export default useFormatters;

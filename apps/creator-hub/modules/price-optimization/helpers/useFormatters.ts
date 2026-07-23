import { Locale, useLocalization } from '@rbx/intl';

export default function useFormatters() {
  const locale = useLocalization().locale ?? Locale.English;
  const changeFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 0,
  });
  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'never',
    maximumFractionDigits: 0,
  });
  const decimalPercentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'always',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const mediumDateFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
  });
  const longDateFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return {
    changeFormatter,
    percentageFormatter,
    decimalPercentageFormatter,
    dateFormatter,
    mediumDateFormatter,
    longDateFormatter,
  };
}

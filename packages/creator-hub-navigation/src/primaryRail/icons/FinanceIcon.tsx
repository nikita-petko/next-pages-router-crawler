import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';

const GBP_REGIONS = new Set(['GB', 'GG', 'IM', 'JE']);

const usesGbpCurrency = (localeOrCountry?: string | null): boolean => {
  if (!localeOrCountry) {
    return false;
  }
  const normalized = localeOrCountry.trim().toUpperCase().replace('_', '-');
  if (normalized === 'GBP' || GBP_REGIONS.has(normalized)) {
    return true;
  }
  try {
    const region = new Intl.Locale(localeOrCountry.replace('_', '-')).maximize().region;
    return region != null && GBP_REGIONS.has(region);
  } catch {
    return false;
  }
};

const detectGbpFromBrowser = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return usesGbpCurrency(navigator.language);
};

const useIsGbp = (): boolean => {
  const { locale } = useLocalization();
  return usesGbpCurrency(locale) || detectGbpFromBrowser();
};

export const FinanceIcon: React.FC = () => {
  const isGbp = useIsGbp();
  return (
    <Icon
      name={isGbp ? 'icon-regular-circle-british-pound-sign' : 'icon-regular-circle-dollar-sign'}
      size='Medium'
    />
  );
};

export const FinanceFillIcon: React.FC = () => {
  const isGbp = useIsGbp();
  return (
    <Icon
      name={isGbp ? 'icon-filled-circle-british-pound-sign' : 'icon-filled-circle-dollar-sign'}
      size='Medium'
    />
  );
};

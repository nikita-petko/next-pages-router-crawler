import type { Locale } from '@rbx/intl';

const rootServiceKey = 'priceConfigurationApi';

/** Query key for [useGetUniversePinnedPrice]({@link ./useGetUniversePinnedPrice.ts}) */
export const getUniversePinnedPriceQueryKey = (universeId: number) =>
  [rootServiceKey, 'getUniversePinnedPrice', universeId] as const;

/** Query key for [useGetUniversePinnedLocation]({@link ./useGetUniversePinnedLocation.ts}) */
export const getUniversePinnedLocationQueryKey = (universeId: number) =>
  [rootServiceKey, 'getUniversePinnedLocation', universeId] as const;

/** Query key for [useGetSupportedCountries]{@link ./useGetSupportedCountries} */
export const getSupportedCountriesQueryKey = (locale?: Locale) =>
  [rootServiceKey, 'getSupportedCountries', locale] as const;

export const queryRetry = 1;

export const pollingInterval = 1000;

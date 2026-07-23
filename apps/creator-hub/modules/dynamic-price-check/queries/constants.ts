const rootServiceKey = 'priceConfigurationApi';

/** Query key for [useGetUniverseFixedPrice]({@link ./useGetUniverseFixedPrice.ts}) */
export const getUniverseFixedPriceQueryKey = (universeId: number) =>
  [rootServiceKey, 'getUniverseFixedPrice', universeId] as const;

/** Query key for [useGetUniversePinnedLocation]({@link ./useGetUniversePinnedLocation.ts}) */
export const getUniversePinnedLocationQueryKey = (universeId: number) =>
  [rootServiceKey, 'getUniversePinnedLocation', universeId] as const;

/** Query key for [useGetSupportedCountries]{@link ./useGetSupportedCountries} */
export const getSupportedCountriesQueryKey = [rootServiceKey, 'getSupportedCountries'] as const;

export const queryRetry = 1;

export const pollingInterval = 1000;

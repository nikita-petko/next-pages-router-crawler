import { useMemo } from 'react';
import type {
  UniversePinnedPrice,
  UniversePinnedLocation,
} from '@rbx/client-price-configuration-api/v1';
import { Locale, useLocalization } from '@rbx/intl';
import { useGetUniversePinnedLocation } from '../queries/useGetUniversePinnedLocation';
import { useGetUniversePinnedPrice } from '../queries/useGetUniversePinnedPrice';
import type { PriceValidationConfig, Country } from '../types';
import { isActiveStatus } from '../utils/priceValidationStatusUtils';

type UsePriceValidationConfigReturn =
  | { config: PriceValidationConfig; isLoading: false; isError: false }
  | { config: undefined; isLoading: true; isError: false }
  | { config: undefined; isLoading: false; isError: true };

function iso2CodeToCountry({
  code,
  locale,
}: {
  code?: string | null;
  locale?: Intl.LocalesArgument;
} = {}): Country | null {
  if (!code) {
    return null;
  }

  const upperCode = code.toUpperCase();
  const regionNames = new Intl.DisplayNames(locale, {
    type: 'region',
    fallback: 'code',
  });

  // `fallback: 'code'` guarantees a string for valid ISO codes, but TS still
  // types `.of()` as `string | undefined`, so fall back to the upper-cased code.
  const displayName = regionNames.of(upperCode) ?? upperCode;
  return {
    displayName,
    code,
  };
}

function parsePriceValidationConfig({
  universePinnedPrice,
  universePinnedLocation,
  locale,
}: {
  universePinnedPrice?: UniversePinnedPrice;
  universePinnedLocation?: UniversePinnedLocation;
  locale?: Intl.LocalesArgument;
}): PriceValidationConfig {
  const config: PriceValidationConfig = {
    testing: null,
    status: 'Disabled',
    userIds: [],
    price: null,
    location: null,
    hasPreviouslyEnabledPricePinning: false,
    hasPreviouslyEnabledLocationPinning: false,
  };

  // NOTE: price pinning and location pinning are always mutually exclusive
  if (universePinnedPrice && isActiveStatus(universePinnedPrice.status)) {
    config.testing = 'price';
    config.status = universePinnedPrice.status;
    config.userIds = universePinnedPrice.userIds;
    config.price = universePinnedPrice.price;
  } else if (universePinnedLocation && isActiveStatus(universePinnedLocation.status)) {
    config.testing = 'location';
    config.status = universePinnedLocation.status;
    config.userIds = universePinnedLocation.userIds;
    config.location = iso2CodeToCountry({
      locale,
      code: universePinnedLocation.countryIso2Code,
    });
  }

  // If the response returns user ids, we can assume that the user has definitely used the feature
  config.hasPreviouslyEnabledPricePinning = !!universePinnedPrice?.userIds.length;
  config.hasPreviouslyEnabledLocationPinning = !!universePinnedLocation?.userIds.length;

  return config;
}

export function usePriceValidationConfig(
  universeId?: number,
  { skipPollingForDisable }: { skipPollingForDisable?: boolean } = {},
): UsePriceValidationConfigReturn {
  const {
    data: universePinnedPrice,
    isLoading: isLoadingPricePinning,
    isError: isErrorPricePinning,
  } = useGetUniversePinnedPrice(universeId ?? 0, {
    enabled: !!universeId,
    skipPollingForDisable,
  });

  const {
    data: universePinnedLocation,
    isLoading: isLoadingLocationPinning,
    isError: isErrorLocationPinning,
  } = useGetUniversePinnedLocation(universeId ?? 0, {
    enabled: !!universeId,
    skipPollingForDisable,
  });

  const isLoading = !universeId || isLoadingPricePinning || isLoadingLocationPinning;
  const isError = isErrorPricePinning || isErrorLocationPinning;

  const locale = useLocalization().locale ?? Locale.English;

  const config = useMemo(
    () =>
      parsePriceValidationConfig({
        universePinnedPrice,
        universePinnedLocation,
        locale,
      }),
    [universePinnedPrice, universePinnedLocation, locale],
  );

  if (isError) {
    return { config: undefined, isLoading: false, isError: true };
  }

  if (isLoading) {
    return { config: undefined, isLoading: true, isError: false };
  }

  return { config, isLoading: false, isError: false };
}

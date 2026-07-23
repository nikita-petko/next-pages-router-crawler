import { useMemo } from 'react';
import { Locale, useLocalization } from '@rbx/intl';
import type {
  GetUniverseFixedPriceResponse,
  GetUniversePinnedLocationResponse,
} from '@rbx/clients/priceConfigurationApi/v1';
import useGetUniverseFixedPrice from '../queries/useGetUniverseFixedPrice';
import useGetUniversePinnedLocation from '../queries/useGetUniversePinnedLocation';
import { isActiveStatus } from '../utils/priceValidationStatusUtils';
import type { PriceValidationConfig, Country } from '../types';

type UsePriceValidationConfigReturn =
  | { config: PriceValidationConfig; isLoading: false; isError: false }
  | { config: undefined; isLoading: true; isError: false }
  | { config: undefined; isLoading: false; isError: true }
  | { config: undefined; isLoading: true; isError: true };

function iso2CodeToCountry({
  code,
  locale = navigator.language,
}: {
  code?: string | null;
  locale?: Intl.LocalesArgument;
} = {}): Country | null {
  if (!code) {
    return null;
  }

  const regionNames = new Intl.DisplayNames(locale, {
    type: 'region',
    fallback: 'code',
  });

  const displayName = regionNames.of(code.toUpperCase())!;
  return {
    displayName,
    code,
  };
}

function parsePriceValidationConfig({
  universeFixedPrice,
  universePinnedLocation,
  locale = navigator.language,
}: {
  universeFixedPrice?: GetUniverseFixedPriceResponse;
  universePinnedLocation?: GetUniversePinnedLocationResponse;
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
  if (universeFixedPrice && isActiveStatus(universeFixedPrice.status)) {
    config.testing = 'price';
    config.status = universeFixedPrice.status;
    config.userIds = universeFixedPrice.userIds;
    config.price = universeFixedPrice.fixedPrice;
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
  config.hasPreviouslyEnabledPricePinning = !!universeFixedPrice?.userIds.length;
  config.hasPreviouslyEnabledLocationPinning = !!universePinnedLocation?.userIds.length;

  return config;
}

export default function usePriceValidationConfig(
  universeId?: number,
  { skipPollingForDisable }: { skipPollingForDisable?: boolean } = {},
): UsePriceValidationConfigReturn {
  const {
    data: universeFixedPrice,
    isLoading: isLoadingPricePinning,
    isError: isErrorPricePinning,
  } = useGetUniverseFixedPrice(universeId!, {
    enabled: !!universeId,
    skipPollingForDisable,
  });

  const {
    data: universePinnedLocation,
    isLoading: isLoadingLocationPinning,
    isError: isErrorLocationPinning,
  } = useGetUniversePinnedLocation(universeId!, {
    enabled: !!universeId,
    skipPollingForDisable,
  });

  const isLoading = !universeId || isLoadingPricePinning || isLoadingLocationPinning;
  const isError = isErrorPricePinning || isErrorLocationPinning;

  const locale = useLocalization().locale ?? Locale.English;

  const config = useMemo(() => {
    if (isLoading || isError) {
      return undefined;
    }

    return parsePriceValidationConfig({
      universeFixedPrice,
      universePinnedLocation,
      locale,
    });
  }, [isLoading, isError, universeFixedPrice, universePinnedLocation, locale]);

  // Note on assertions: for some reason TS isn't inferring through booleans correctly here
  if (isLoading || isError) {
    return {
      config: undefined,
      isLoading,
      isError,
    } as UsePriceValidationConfigReturn;
  }

  return {
    config: config!,
    isLoading,
    isError,
  };
}

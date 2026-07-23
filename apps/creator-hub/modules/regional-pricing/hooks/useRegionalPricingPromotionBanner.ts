/* istanbul ignore file */
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import { useCallback, useMemo } from 'react';
import {
  lastClosedDeveloperProductsPromotionBannerKey,
  lastClosedGamePassesPromotionBannerKey,
  lastClosedRegionalPricingPromotionBannerKey,
} from '../localStorageKeys';

const PromotionBannerPageKeys = {
  'monetization/developer-products': lastClosedDeveloperProductsPromotionBannerKey,
  'monetization/passes': lastClosedGamePassesPromotionBannerKey,
  'monetization/overview': lastClosedRegionalPricingPromotionBannerKey,
} as const;

export type UseRegionalPricingPromotionBannerParams = {
  universeId: number;
  page: keyof typeof PromotionBannerPageKeys;
};

function useRegionalPricingPromotionBanner({
  universeId,
  page,
}: UseRegionalPricingPromotionBannerParams) {
  const { user } = useAuthentication();

  const getPromotionBannerStorageKey = PromotionBannerPageKeys[page];
  if (!getPromotionBannerStorageKey) {
    throw new Error(`Invalid promotion banner page: ${page}`);
  }

  // Use epoch to flag whether banner has been closed - for now, we're only doing it
  // allowing the user to close once (no reopen), but in the event we want to change this
  // behavior, we can use this flag to determine when to reopen the banner
  const promoBannerStorageKey = getPromotionBannerStorageKey(universeId, user?.id);
  const [bannerClosedTime, setBannerClosedTime] = useLocalStorage<number | null>(
    promoBannerStorageKey,
    null,
  );

  const isOpen = bannerClosedTime === null;

  const close = useCallback(() => {
    setBannerClosedTime(Date.now());
  }, [setBannerClosedTime]);

  return useMemo(() => ({ isOpen, close }) as const, [close, isOpen]);
}

export function useDeveloperProductsRegionalPricingPromotionBanner(universeId: number) {
  return useRegionalPricingPromotionBanner({ universeId, page: 'monetization/developer-products' });
}

export function usePassesRegionalPricingPromotionBanner(universeId: number) {
  return useRegionalPricingPromotionBanner({ universeId, page: 'monetization/passes' });
}

export function useOverviewRegionalPricingPromotionBanner(universeId: number) {
  return useRegionalPricingPromotionBanner({ universeId, page: 'monetization/overview' });
}

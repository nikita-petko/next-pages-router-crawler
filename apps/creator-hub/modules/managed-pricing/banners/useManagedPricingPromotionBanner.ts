import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useIsManagedPricingAvailable } from '../hooks/useIsManagedPricingAvailable';

export const PromotionBannerPageKeys = {
  'managed-pricing/overview': (universeId: number) =>
    `lastClosedManagedPricingOverviewPromotionBanner.${universeId}`,
  'monetization/overview': (universeId: number) =>
    `lastClosedManagedPricingMonetizationPromotionBanner.${universeId}`,
  'monetization/developer-products': (universeId: number) =>
    `lastClosedManagedPricingDeveloperProductsPromotionBanner.${universeId}`,
  'monetization/passes': (universeId: number) =>
    `lastClosedManagedPricingPassesPromotionBanner.${universeId}`,
} as const;

type UseManagedPricingPromotionBannerParams = {
  universeId: number;
  page: keyof typeof PromotionBannerPageKeys;
};

export function useManagedPricingPromotionBanner({
  universeId,
  page,
}: UseManagedPricingPromotionBannerParams) {
  const getPromotionBannerStorageKey = PromotionBannerPageKeys[page];
  /* istanbul ignore if -- guarded case by page typing */
  if (!getPromotionBannerStorageKey) {
    throw new Error(`Invalid promotion banner page: ${page}`);
  }

  // Use epoch to flag whether banner has been closed - for now, we're only doing it
  // allowing the user to close once (no reopen), but in the event we want to change this
  // behavior, we can use this flag to determine when to reopen the banner
  const promoBannerStorageKey = getPromotionBannerStorageKey(universeId);
  const [bannerClosedTime, setBannerClosedTime] = useLocalStorage<number | null>(
    promoBannerStorageKey,
    null,
  );

  const managedPricingOverviewStorageKey =
    PromotionBannerPageKeys['managed-pricing/overview'](universeId);
  const [, setManagedPricingOverviewBannerClosedTime] = useLocalStorage<number | null>(
    managedPricingOverviewStorageKey,
    null,
  );

  const isOpen = bannerClosedTime === null;

  const close = useCallback(() => {
    setBannerClosedTime(Date.now());
  }, [setBannerClosedTime]);

  const closeManagedPricingOverviewBanner = useCallback(() => {
    setManagedPricingOverviewBannerClosedTime(Date.now());
  }, [setManagedPricingOverviewBannerClosedTime]);

  return useMemo(
    () => ({ isOpen, close, closeManagedPricingOverviewBanner }) as const,
    [close, closeManagedPricingOverviewBanner, isOpen],
  );
}

/**
 * Resolves whether the managed-pricing promotion banner currently occupies its
 * slot on the given page. Managed pricing must be available and the banner not
 * dismissed
 */
export function useIsManagedPricingPromotionBannerShown(
  universeId: number,
  page: keyof typeof PromotionBannerPageKeys,
): boolean | undefined {
  const { data: isManagedPricingAvailable } = useIsManagedPricingAvailable(universeId);
  const { isOpen } = useManagedPricingPromotionBanner({ universeId, page });

  if (isManagedPricingAvailable === undefined) {
    return undefined;
  }

  return isManagedPricingAvailable && isOpen;
}

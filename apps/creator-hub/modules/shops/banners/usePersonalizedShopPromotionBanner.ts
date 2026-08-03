import { useCallback } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';

export const getPersonalizedShopPromotionBannerStorageKey = (universeId: number) =>
  `lastClosedPersonalizedShopPromotionBanner.${universeId}`;

/**
 * Tracks dismissal of the personalized-shop promotion banner, persisted per
 * universe in localStorage. Stores the close epoch so future reopen logic can
 * key off it; today a dismissed banner stays closed.
 */
export function usePersonalizedShopPromotionBanner(universeId: number) {
  const [bannerClosedTime, setBannerClosedTime] = useLocalStorage<number | null>(
    getPersonalizedShopPromotionBannerStorageKey(universeId),
    null,
  );

  const isOpen = bannerClosedTime === null;

  const close = useCallback(() => {
    setBannerClosedTime(Date.now());
  }, [setBannerClosedTime]);

  return { isOpen, close } as const;
}

/**
 * Resolves whether the personalized-shop promotion banner currently occupies its
 * slot: shown while the banner has not been dismissed yet.
 */
export function useIsPersonalizedShopPromotionBannerShown(universeId: number): boolean {
  const { isOpen } = usePersonalizedShopPromotionBanner(universeId);
  return isOpen;
}

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';

export const lastClosedDevExO18UpsellBannerKey = (universeId: number, userId?: number) =>
  `lastClosedDevExO18UpsellBanner.${universeId}.${userId}`;

export const lastClosedDevExO18EligibleBannerKey = (universeId: number, userId?: number) =>
  `lastClosedDevExO18EligibleBanner.${universeId}.${userId}`;

function useDevExO18BannerDismissal(universeId: number) {
  const { user } = useAuthentication();

  const [upsellBannerClosedTime, setUpsellBannerClosedTime] = useLocalStorage<number | null>(
    lastClosedDevExO18UpsellBannerKey(universeId, user?.id),
    null,
  );
  const [eligibleBannerClosedTime, setEligibleBannerClosedTime] = useLocalStorage<number | null>(
    lastClosedDevExO18EligibleBannerKey(universeId, user?.id),
    null,
  );

  const closeUpsellBanner = useCallback(() => {
    setUpsellBannerClosedTime(Date.now());
  }, [setUpsellBannerClosedTime]);

  const closeEligibleBanner = useCallback(() => {
    setEligibleBannerClosedTime(Date.now());
  }, [setEligibleBannerClosedTime]);

  return useMemo(
    () =>
      ({
        isUpsellBannerOpen: upsellBannerClosedTime === null,
        isEligibleBannerOpen: eligibleBannerClosedTime === null,
        closeUpsellBanner,
        closeEligibleBanner,
      }) as const,
    [closeEligibleBanner, closeUpsellBanner, eligibleBannerClosedTime, upsellBannerClosedTime],
  );
}

export default useDevExO18BannerDismissal;

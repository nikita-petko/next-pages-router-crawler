import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { lastDismissedGiftingTradingWarningBannerKey } from '../localStorageKeys';

const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // One day in milliseconds

// Periodically we want to show this banner if it's dismissed
export const shouldShowGiftingTradingWarningBanner = (lastDismissedTime: number | null) => {
  if (lastDismissedTime === null) {
    return true; // Banner has never been dismissed
  }

  return Date.now() - lastDismissedTime >= oneDayInMilliseconds;
};

export function useGiftingTradingWarningBanner(universeId: number) {
  const [lastDismissedBannerTime, setLastDismissedBannerTime] = useLocalStorage<number | null>(
    lastDismissedGiftingTradingWarningBannerKey(universeId),
    null,
  );

  const close = useCallback(() => {
    setLastDismissedBannerTime(Date.now());
  }, [setLastDismissedBannerTime]);

  const isDismissed = !shouldShowGiftingTradingWarningBanner(lastDismissedBannerTime);

  return useMemo(() => ({ isDismissed, close }), [isDismissed, close]);
}

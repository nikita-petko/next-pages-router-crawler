import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { lastDismissedGiftingTradingWarningBannerKey } from '@modules/regional-pricing/localStorageKeys';
import { useGetGiftingTradingStatus } from '../queries/useGetGiftingTradingStatus';
import { useSetGiftingTradingStatus } from '../queries/useSetGiftingTradingStatus';

const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // One day in milliseconds

// Periodically we want to show this banner if it's dismissed
const isGiftingTradingWarningBannerDismissed = (lastDismissedTime: number | null) => {
  if (lastDismissedTime === null) {
    return false; // Banner has never been dismissed
  }

  return Date.now() - lastDismissedTime < oneDayInMilliseconds;
};

/**
 * Options for trading gifting acknowledgement.
 */
export const TradingGiftingAckOptions = {
  NoTradingGifting: 'no-trading-gifting-acked',
  WithTradingGifting: 'with-trading-gifting-checks',
} as const;

export type TradingGiftingAckOption =
  (typeof TradingGiftingAckOptions)[keyof typeof TradingGiftingAckOptions];

/**
 * Hook for managing trading gifting acknowledgement.
 */
export function useGiftingTradingAcknowledgementSelection(universeId: number) {
  const [hasViewedDocumentation, setHasViewedDocumentation] = useState<boolean>(false);
  const [tradingGiftingAck, setTradingGiftingAck] = useState<string | null>(null);

  const { mutateAsync: setGiftingTradingStatus, isPending } = useSetGiftingTradingStatus();

  const accept = useCallback(async () => {
    try {
      await setGiftingTradingStatus({
        universeId,
        hasGiftingTrading: tradingGiftingAck === TradingGiftingAckOptions.WithTradingGifting,
      });
    } catch {
      // Fail open for now, users will be reprompted on next load.
    }
  }, [setGiftingTradingStatus, tradingGiftingAck, universeId]);

  const reset = useCallback(() => {
    setHasViewedDocumentation(false);
    setTradingGiftingAck(null);
  }, []);

  return {
    hasViewedDocumentation,
    setHasViewedDocumentation,
    tradingGiftingAck,
    setTradingGiftingAck,
    accept,
    isPending,
    reset,
  } as const;
}

/**
 * Funnel events for trading gifting acknowledgement in managed pricing flows.
 */
export const TradingGiftingAckFunnelEventsV2 = {
  Accepted: 'ManagedPricing.Disclaimer.DeveloperProductTradingGiftingAck.Accepted',
  ClickedDocumentation:
    'ManagedPricing.Disclaimer.DeveloperProductTradingGiftingAck.ClickedDocumentation',
  Viewed: 'ManagedPricing.Disclaimer.DeveloperProductTradingGiftingAck.Viewed',
} as const;

/**
 * Tracking callbacks for trading gifting acknowledgement funnel events in managed pricing flows.
 */
export function useGiftingTradingAcknowledgementFunnelEventsV2(universeId: number, page?: string) {
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { data: giftingTradingStatus } = useGetGiftingTradingStatus(universeId, {
    select: (data) => data.giftingTradingStatus,
  });

  const trackImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: TradingGiftingAckFunnelEventsV2.Viewed,
      parameters: {
        universe_id: universeId.toString(),
        user_id: user?.id?.toString() ?? '',
        page: page ?? '',
        gifting_trading_status: giftingTradingStatus ?? '',
      },
    });
  }, [giftingTradingStatus, page, unifiedLogger, universeId, user?.id]);

  const trackDocumentationClickEvent = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: TradingGiftingAckFunnelEventsV2.ClickedDocumentation,
      parameters: {
        universe_id: universeId.toString(),
        user_id: user?.id?.toString() ?? '',
        page: page ?? '',
        gifting_trading_status: giftingTradingStatus ?? '',
      },
    });
  }, [giftingTradingStatus, page, unifiedLogger, universeId, user?.id]);

  const trackAcceptEvent = useCallback(
    (tradingGiftingAck: string) => {
      unifiedLogger.logClickEvent({
        eventName: TradingGiftingAckFunnelEventsV2.Accepted,
        parameters: {
          universe_id: universeId.toString(),
          user_id: user?.id?.toString() ?? '',
          page: page ?? '',
          option: tradingGiftingAck ?? '',
          gifting_trading_status: giftingTradingStatus ?? '',
        },
      });
    },
    [giftingTradingStatus, page, unifiedLogger, universeId, user?.id],
  );

  return {
    trackImpressionEvent,
    trackDocumentationClickEvent,
    trackAcceptEvent,
  } as const;
}

/**
 * Hook for managing the dismissal of the gifting trading warning banner.
 */
export function useGiftingTradingWarningBanner(universeId: number) {
  const [lastDismissedBannerTime, setLastDismissedBannerTime] = useLocalStorage<number | null>(
    lastDismissedGiftingTradingWarningBannerKey(universeId),
    null,
  );

  const close = useCallback(() => {
    setLastDismissedBannerTime(Date.now());
  }, [setLastDismissedBannerTime]);

  const isDismissed = isGiftingTradingWarningBannerDismissed(lastDismissedBannerTime);

  return useMemo(() => ({ isDismissed, close }), [isDismissed, close]);
}

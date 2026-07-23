import { useCallback, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useSetGiftingTradingStatus } from '@modules/managed-pricing/queries/useSetGiftingTradingStatus';

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
    await setGiftingTradingStatus({
      universeId,
      hasGiftingTrading: tradingGiftingAck === TradingGiftingAckOptions.WithTradingGifting,
    });
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
 * Funnel events for trading gifting acknowledgement.
 */
export const TradingGiftingAckFunnelEvents = {
  Accepted: 'RegionalPricing.Disclaimer.DeveloperProductTradingGiftingAck.Accepted',
  ClickedDocumentation:
    'RegionalPricing.Disclaimer.DeveloperProductTradingGiftingAck.ClickedDocumentation',
  Viewed: 'RegionalPricing.Disclaimer.DeveloperProductTradingGiftingAck.Viewed',
} as const;

/**
 * Tracking callbacks for trading gifting acknowledgement funnel events.
 */
export function useGiftingTradingAcknowledgementFunnelEvents(universeId: number, page?: string) {
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId);

  const trackImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: TradingGiftingAckFunnelEvents.Viewed,
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
      eventName: TradingGiftingAckFunnelEvents.ClickedDocumentation,
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
        eventName: TradingGiftingAckFunnelEvents.Accepted,
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

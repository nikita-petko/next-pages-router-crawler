import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';

/** Gifting ack is required only when status was passed in and is not yet Acknowledged. */
export const requiresGiftingTradingAcknowledgement = (
  giftingTradingStatus: GiftingTradingStatus | undefined,
): boolean => giftingTradingStatus !== undefined && giftingTradingStatus !== 'Acknowledged';

/**
 * Determines if the gifting trading reminder should be shown based on the gifting trading status.
 * Note this may be delegated to the consumer to determine if the banner should be shown based on
 * external factors.
 */
export const shouldShowGiftingTradingReminder = (
  giftingTradingStatus: GiftingTradingStatus | undefined,
): boolean => {
  return (
    giftingTradingStatus === 'Reacknowledge' ||
    shouldShowGiftingTradingWarning(giftingTradingStatus)
  );
};

/**
 * Determines if the gifting trading warning banner should be shown based on the gifting trading status.
 */
export const shouldShowGiftingTradingWarning = (
  giftingTradingStatus: GiftingTradingStatus | undefined,
): boolean => {
  return (
    giftingTradingStatus === 'WarnNeedsMoreApiCalls' ||
    giftingTradingStatus === 'WarnUnackedUpdates'
  );
};

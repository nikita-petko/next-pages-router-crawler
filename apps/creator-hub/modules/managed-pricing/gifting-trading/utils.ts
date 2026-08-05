import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';

/** Gifting ack is required only when status was passed in and is not yet Acknowledged. */
export const requiresGiftingTradingAcknowledgement = (
  giftingTradingStatus: GiftingTradingStatus | undefined,
): boolean => giftingTradingStatus !== undefined && giftingTradingStatus !== 'Acknowledged';

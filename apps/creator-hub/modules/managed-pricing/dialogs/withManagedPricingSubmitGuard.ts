import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { requiresGiftingTradingAcknowledgement } from '../gifting-trading/utils';
import { isManagedPricingAvailable } from '../hooks/useIsManagedPricingAvailable';
import type { ManagedPricingOnboardingStatus } from '../types';
import { withDisableManagedPricingWarningDialog } from './DisableManagedPricingWarningDialog';
import { openGiftingTradingAcknowledgementDialogV2 } from './GiftingTradingAcknowledgementDialogV2';
import { openManagedPricingAcknowledgementDialog } from './ManagedPricingAcknowledgementDialog';

export type ManagedPricingSubmitGuardOptions = {
  universeId: number;
  /** The desired managed pricing state being submitted. */
  targetStatus?: boolean;
  /** Whether managed pricing is currently enabled on the item. Required for single configuration flows. */
  currentStatus?: boolean;
  /** The number of items being toggled. Required for bulk action flows. */
  count?: number;
  /** The universe-level managed pricing onboarding status. */
  onboardingStatus: ManagedPricingOnboardingStatus | undefined;
  /**
   * Universe gifting/trading status. When omitted, gifting acknowledgement is skipped.
   * When set and not `Acknowledged`, enabling chains through `GiftingTradingAcknowledgementDialogV2`.
   */
  giftingTradingStatus?: GiftingTradingStatus;
  /** Page identifier for gifting/trading funnel events. */
  page?: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * Routes a managed pricing toggle submit through the appropriate confirmation dialog
 * based on the universe's onboarding status and the toggle direction.
 *
 * Decision tree (only when `onboardingStatus` is `'Pending'` or `'Accepted'`):
 * - Disabling (`currentStatus && !targetStatus`) → `withDisableManagedPricingWarningDialog`
 * - Enabling (`!currentStatus && targetStatus`):
 *   - `Pending` → `openManagedPricingAcknowledgementDialog`, then gifting ack if `giftingTradingStatus`
 *     is set and not `Acknowledged`, then `onConfirm`
 *   - `Accepted` + gifting ack required → `openGiftingTradingAcknowledgementDialogV2`, then `onConfirm`
 *   - Otherwise → `onConfirm` directly
 * - All other toggles → `onConfirm` directly
 *
 * Bails out as a no-op for any other onboarding status so callers don't accidentally
 * fire MP dialogs in non-MP flows.
 */
export async function withManagedPricingSubmitGuard({
  universeId,
  currentStatus,
  targetStatus,
  count,
  onboardingStatus,
  giftingTradingStatus,
  page,
  onConfirm,
}: ManagedPricingSubmitGuardOptions): Promise<void> {
  if (!isManagedPricingAvailable(onboardingStatus)) {
    return;
  }

  if (currentStatus !== false && targetStatus === false) {
    await withDisableManagedPricingWarningDialog({ universeId, count, onConfirm });
    return;
  }

  const isEnabling = currentStatus !== true && targetStatus === true;

  if (!isEnabling) {
    await onConfirm();
    return;
  }

  const confirm = async () => {
    if (requiresGiftingTradingAcknowledgement(giftingTradingStatus)) {
      openGiftingTradingAcknowledgementDialogV2({ universeId, page, onConfirm });
      return;
    }

    await onConfirm();
  };

  if (onboardingStatus === 'Pending') {
    openManagedPricingAcknowledgementDialog({
      universeId,
      onConfirm: confirm,
    });
    return;
  }

  await confirm();
}

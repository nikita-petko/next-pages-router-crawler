import { memo, useCallback } from 'react';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { openGiftingTradingAcknowledgementDialogV2 } from '../dialogs/GiftingTradingAcknowledgementDialogV2';
import { useGiftingTradingWarningBanner } from './hooks';
import { shouldShowGiftingTradingReminder } from './utils';

type Props = {
  universeId: number;
  giftingTradingStatus: GiftingTradingStatus | undefined;
  page?: string;
  enabled?: boolean;
  onClose?: () => void;
  className?: string;
};

/**
 * Banner for reminding users to acknowledge gifting trading in their experience.
 * This should only be shown if the gifting trading status is one of the following reminder states:
 * - Reacknowledge
 * - WarnNeedsMoreApiCalls
 * - WarnUnackedUpdates
 */
function GiftingTradingWarningBannerV2({
  universeId,
  page,
  giftingTradingStatus,
  enabled,
  onClose,
  className,
}: Props) {
  const { translate } = useTranslation();

  const { isDismissed, close: closeBanner } = useGiftingTradingWarningBanner(universeId);

  const isVisible =
    (enabled ?? true) && !isDismissed && shouldShowGiftingTradingReminder(giftingTradingStatus);

  const isReacknowledgement = giftingTradingStatus === 'Reacknowledge';

  const handleClose = useCallback(() => {
    closeBanner();
    onClose?.();
  }, [closeBanner, onClose]);

  const handleConfirm = useCallback(() => {
    openGiftingTradingAcknowledgementDialogV2({ universeId, page });
  }, [universeId, page]);

  if (!isVisible) {
    return null;
  }

  return (
    <FeedbackBanner
      layout='Stacked'
      variant={isReacknowledgement ? 'Standard' : 'Emphasis'}
      severity={isReacknowledgement ? 'Info' : 'Warning'}
      title={translate('Heading.GiftingTradingWarning')}
      description={
        isReacknowledgement
          ? translate('Description.GiftingTradingReacknowledge')
          : translate('Description.GiftingTradingWarning')
      }
      className={className}
      primaryActionLabel={translate('Action.Confirm')}
      onPrimaryAction={handleConfirm}
      onDismiss={handleClose}
      dismissIconAriaLabel={translate('Action.Close')}
    />
  );
}

export default withTranslation(memo(GiftingTradingWarningBannerV2), [
  TranslationNamespace.RegionalPricing,
]);

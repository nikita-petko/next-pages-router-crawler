import { Fragment, memo, useCallback } from 'react';
import { Alert, AlertTitle, Button, CloseIcon, IconButton } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { GiftingTradingStatus } from '@rbx/clients/developerProductsApi';
import { useDeveloperProductRegionalPricingDisclaimer } from './DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import GiftingTradingWarningAcknowledgementModal, {
  useGiftingTradingWarningDisclaimer,
} from './DeveloperProductRegionalPricingDisclaimerModal/GiftingTradingWarningAcknowledgementModal';
import { useGiftingTradingWarningBanner } from '../hooks/useGiftingTradingWarningBanner';

type Props = {
  universeId: number;
  giftingTradingStatus: GiftingTradingStatus | undefined;
  page?: string;
  enabled?: boolean;
  onClose?: () => void;
  className?: string;
};

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
    giftingTradingStatus === 'WarnNeedsMoreApiCalls' ||
    giftingTradingStatus === 'WarnUnackedUpdates'
  );
};

/**
 * Banner for reminding users to acknowledge gifting trading in their experience.
 * This should only be shown if the gifting trading status is one of the following reminder states:
 * - Reacknowledge
 * - WarnNeedsMoreApiCalls
 * - WarnUnackedUpdates
 */
const GiftingTradingWarningBanner = ({
  universeId,
  page,
  giftingTradingStatus,
  enabled = true,
  onClose,
  className,
}: Props) => {
  const { translate } = useTranslation();

  const { isDismissed, close: closeBanner } = useGiftingTradingWarningBanner(universeId);

  const isVisible =
    enabled && !isDismissed && shouldShowGiftingTradingReminder(giftingTradingStatus);

  const isReacknowledgement = giftingTradingStatus === 'Reacknowledge';

  const handleClose = useCallback(() => {
    closeBanner();
    onClose?.();
  }, [closeBanner, onClose]);

  const { withDisclaimer: withGiftingTradingWarningDisclaimer } =
    useGiftingTradingWarningDisclaimer(universeId);
  const { withDisclaimer: withDeveloperProductRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const handleConfirm = useCallback(() => {
    if (isReacknowledgement) {
      withDeveloperProductRegionalPricingDisclaimer(() => {
        closeBanner();
        handleClose();
      });
    } else {
      withGiftingTradingWarningDisclaimer(() => {
        closeBanner();
        handleClose();
      });
    }
  }, [
    withGiftingTradingWarningDisclaimer,
    withDeveloperProductRegionalPricingDisclaimer,
    closeBanner,
    handleClose,
    isReacknowledgement,
  ]);

  if (!isVisible) {
    return null;
  }

  return (
    <Fragment>
      <Alert
        severity={isReacknowledgement ? 'info' : 'warning'}
        variant='outlined'
        className={className}
        action={[
          <Button
            key='giftingTradingWarningAction-confirm'
            color='inherit'
            size='small'
            onClick={handleConfirm}>
            {translate('Action.Confirm')}
          </Button>,
          <IconButton
            key='giftingTradingWarningAction-close'
            aria-label={translate('Action.Close')}
            color='secondary'
            onClick={handleClose}>
            <CloseIcon />
          </IconButton>,
        ]}>
        <AlertTitle className='padding-bottom-[4px]'>
          {translate('Heading.GiftingTradingWarning')}
        </AlertTitle>
        <span>
          {isReacknowledgement
            ? translate('Description.GiftingTradingReacknowledge')
            : translate('Description.GiftingTradingWarning')}
        </span>
      </Alert>
      <GiftingTradingWarningAcknowledgementModal universeId={universeId} page={page} />
    </Fragment>
  );
};

export default withTranslation(memo(GiftingTradingWarningBanner), [
  TranslationNamespace.RegionalPricing,
]);

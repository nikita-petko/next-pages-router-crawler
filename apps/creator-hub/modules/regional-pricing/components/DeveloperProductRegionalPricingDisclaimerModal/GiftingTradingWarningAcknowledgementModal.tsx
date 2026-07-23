import { memo, useCallback, useEffect } from 'react';
// TODO: Replace with `Dialog` from `@rbx/ui` or `@rbx/foundation-ui` (supports fullScreen via `TDialogProps`)
// eslint-disable-next-line import/no-extraneous-dependencies -- currently required for responsive fullscreen support, update when we migrate to foundation
import { Dialog as MuiDialog } from '@mui/material';
import { Button, DialogActions, DialogContent, DialogTitle, useMediaQuery } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import {
  useOneTimeDisclaimer,
  useOneTimeDisclaimerState,
} from '@modules/monetization-shared/useOneTimeDisclaimer';
import {
  useGiftingTradingAcknowledgementFunnelEvents,
  useGiftingTradingAcknowledgementSelection,
} from '../../hooks/useGiftingTradingAcknowledgement';
import { useGiftingTradingWarningBanner } from '../../hooks/useGiftingTradingWarningBanner';
import { hasAcceptedGiftingTradingWarningDisclaimerKey } from '../../localStorageKeys';
import GiftingTradingRadioSelectionAlert from './GiftingTradingRadioSelectionAlert';
import useDeveloperProductRegionalPricingDisclaimerModalStyles from './DeveloperProductRegionalPricingDisclaimerModal.styles';

export const useGiftingTradingWarningDisclaimer = (universeId: number) => {
  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId);

  return useOneTimeDisclaimer(
    hasAcceptedGiftingTradingWarningDisclaimerKey(universeId),
    { hasAccepted: giftingTradingStatus === 'Acknowledged' }, // Keep closed when gifting trading is acknowledged
  );
};

type Props = {
  universeId: number;
  page?: string;
};

/**
 * Warning modal for acknowledging trading gifting in an experience. Used for
 * experiences that need to re-acknowledge trading gifting in their experience.
 */
function GiftingTradingWarningAcknowledgementModal({ universeId, page }: Props) {
  const { translate } = useTranslation();
  const { classes } = useDeveloperProductRegionalPricingDisclaimerModalStyles();
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const {
    hasViewedDocumentation,
    setHasViewedDocumentation,
    tradingGiftingAck,
    setTradingGiftingAck,
    accept,
    isPending,
    reset: resetSelection,
  } = useGiftingTradingAcknowledgementSelection(universeId);

  const { trackImpressionEvent, trackDocumentationClickEvent, trackAcceptEvent } =
    useGiftingTradingAcknowledgementFunnelEvents(universeId, page);

  const { close: closeGiftingTradingWarningBanner } = useGiftingTradingWarningBanner(universeId);

  const handleAccept = useCallback(() => {
    trackAcceptEvent(tradingGiftingAck!);
    closeGiftingTradingWarningBanner();
  }, [trackAcceptEvent, tradingGiftingAck, closeGiftingTradingWarningBanner]);

  const disclaimer = useOneTimeDisclaimerState(
    hasAcceptedGiftingTradingWarningDisclaimerKey(universeId),
    { setAccepted: accept, onAccept: handleAccept },
  );

  const handleDocumentationClick = useCallback(() => {
    setHasViewedDocumentation(true);
    trackDocumentationClickEvent();
  }, [setHasViewedDocumentation, trackDocumentationClickEvent]);

  const handleSelectTradingGiftingAck = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, value: string) => {
      setTradingGiftingAck(value);
    },
    [setTradingGiftingAck],
  );

  useEffect(() => {
    // Reset when the modal is closed
    if (!disclaimer.isOpen) {
      resetSelection();
    } else {
      trackImpressionEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only need to run on isOpen changes
  }, [disclaimer.isOpen]);

  return (
    <MuiDialog
      // Note: need to use MUI Dialog to allow fullScreen
      aria-labelledby='developer-product-trading-gifting-warning-acknowledgement'
      open={disclaimer.isOpen}
      onClose={disclaimer.close}
      fullScreen={fullScreen}>
      <DialogTitle id='developer-product-trading-gifting-warning-acknowledgement'>
        {translate('Heading.Disclaimer')}
      </DialogTitle>
      <DialogContent>
        <GiftingTradingRadioSelectionAlert
          severity='warning'
          className={classes.modalAlert}
          disabled={!hasViewedDocumentation}
          value={tradingGiftingAck}
          onChange={handleSelectTradingGiftingAck}
          onClickDocumentation={handleDocumentationClick}
        />
      </DialogContent>
      <DialogActions>
        <Button size='large' color='secondary' variant='contained' onClick={disclaimer.close}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          size='large'
          color='primaryBrand'
          variant='contained'
          loading={isPending}
          disabled={!tradingGiftingAck || isPending}
          onClick={disclaimer.accept}>
          {translate('Action.Proceed')}
        </Button>
      </DialogActions>
    </MuiDialog>
  );
}

export default withTranslation(memo(GiftingTradingWarningAcknowledgementModal), [
  TranslationNamespace.RegionalPricing,
]);

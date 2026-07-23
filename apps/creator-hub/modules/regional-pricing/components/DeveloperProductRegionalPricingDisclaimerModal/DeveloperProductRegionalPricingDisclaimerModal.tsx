import { memo, useCallback, useEffect } from 'react';
// TODO: Replace with `Dialog` from `@rbx/ui` or `@rbx/foundation-ui` (supports fullScreen via `TDialogProps`)
// eslint-disable-next-line import/no-extraneous-dependencies -- currently required for responsive fullscreen support, update when we migrate to foundation
import { Dialog as MuiDialog } from '@mui/material';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import {
  useOneTimeDisclaimer,
  useOneTimeDisclaimerState,
} from '@modules/monetization-shared/useOneTimeDisclaimer';
import { ROBLOX_TERMS_OF_USE } from '@modules/miscellaneous/common/constants/linkConstants';
import {
  useGiftingTradingAcknowledgementFunnelEvents,
  useGiftingTradingAcknowledgementSelection,
} from '../../hooks/useGiftingTradingAcknowledgement';
import { hasAcceptedDevProductRegionalPricingDisclaimerKey } from '../../localStorageKeys';
import GiftingTradingRadioSelectionAlert from './GiftingTradingRadioSelectionAlert';
import useDeveloperProductRegionalPricingDisclaimerModalStyles from './DeveloperProductRegionalPricingDisclaimerModal.styles';
import { useGiftingTradingWarningBanner } from '../../hooks/useGiftingTradingWarningBanner';

export const useDeveloperProductRegionalPricingDisclaimer = (universeId: number) => {
  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId);

  return useOneTimeDisclaimer(
    hasAcceptedDevProductRegionalPricingDisclaimerKey(universeId),
    { hasAccepted: giftingTradingStatus === 'Acknowledged' }, // Keep closed when gifting trading is acknowledged
  );
};

type Props = {
  universeId: number;
  page?: string;
};

/**
 * Acknowledgement modal for enabling developer product regional pricing
 */
function DeveloperProductRegionalPricingDisclaimerModal({ universeId, page }: Props) {
  const { translate, translateHTML } = useTranslation();
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
  }, [tradingGiftingAck, trackAcceptEvent, closeGiftingTradingWarningBanner]);

  const disclaimer = useOneTimeDisclaimerState(
    hasAcceptedDevProductRegionalPricingDisclaimerKey(universeId),
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
      aria-labelledby='developer-product-regional-pricing-acknowledgement'
      open={disclaimer.isOpen}
      onClose={disclaimer.close}
      fullScreen={fullScreen}>
      <DialogTitle id='developer-product-regional-pricing-acknowledgement'>
        {translate('Heading.Disclaimer')}
      </DialogTitle>
      <DialogContent>
        <Typography component='p' variant='body2' color='secondary'>
          {translateHTML(
            'Description.Disclaimer',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link
                    className={classes.fontWeightLight}
                    target='_blank'
                    href={ROBLOX_TERMS_OF_USE}>
                    {chunks}
                  </Link>
                ),
              },
            ],
            { lineBreak: <br /> },
          )}
        </Typography>

        <GiftingTradingRadioSelectionAlert
          severity='info'
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

export default withTranslation(memo(DeveloperProductRegionalPricingDisclaimerModal), [
  TranslationNamespace.RegionalPricing,
]);

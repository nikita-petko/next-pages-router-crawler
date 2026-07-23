import { useEffect, useState } from 'react';
import {
  Button,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Radio,
  RadioGroup,
} from '@rbx/foundation-ui';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { Link } from '@modules/monetization-shared/link';
import {
  TradingGiftingAckOptions,
  useGiftingTradingAcknowledgementFunnelEventsV2,
  useGiftingTradingAcknowledgementSelection,
  useGiftingTradingWarningBanner,
} from '../gifting-trading/hooks';

const priceLevelApiDocumentationUrl = docs.getPriceLevelsApiMonetizationUrl();

type Props = {
  universeId: number;
  /** Page identifier forwarded to funnel events for analytics attribution. */
  page?: string;
  /** Called after the user confirms and the acknowledgement has been recorded. */
  onConfirm?: () => void | Promise<void>;
  onClose: () => void;
};

function GiftingTradingAcknowledgementDialogContentV2({
  universeId,
  page,
  onConfirm,
  onClose,
}: Props) {
  const { translate, translateHTML } = useTranslationWithNamespace(
    TranslationNamespace.ManagedPricing,
  );

  const { trackImpressionEvent, trackDocumentationClickEvent, trackAcceptEvent } =
    useGiftingTradingAcknowledgementFunnelEventsV2(universeId, page);

  const { tradingGiftingAck, setTradingGiftingAck, accept } =
    useGiftingTradingAcknowledgementSelection(universeId);

  const { close: closeGiftingTradingWarningBanner } = useGiftingTradingWarningBanner(universeId);

  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    trackImpressionEvent();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- only need to run on mount
  }, []);

  const handleContinue = async () => {
    /* istanbul ignore if -- unreachable defensive check */
    if (!tradingGiftingAck) {
      return;
    }

    setIsTransitioning(true);

    await accept();

    trackAcceptEvent(tradingGiftingAck);
    closeGiftingTradingWarningBanner();

    onClose();

    await onConfirm?.();
  };

  return (
    <DialogContent
      className='!min-width-[280px] width-full'
      // Prevent highlighting first radio on open
      onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-medium margin-y-none padding-bottom-xsmall'>
          {translate('Heading.ProtectYourRevenue')}
        </DialogTitle>

        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {translateHTML('Message.GiftingTradingAcknowledgement', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks) => (
                <Link
                  href={priceLevelApiDocumentationUrl}
                  target='_blank'
                  underline='always'
                  color='Standard'
                  onClick={trackDocumentationClickEvent}>
                  {chunks}
                </Link>
              ),
            },
          ])}
        </span>

        <RadioGroup
          size='Medium'
          placement='Start'
          required
          value={tradingGiftingAck ?? undefined}
          onValueChange={setTradingGiftingAck}
          isDisabled={isTransitioning}>
          <Radio
            value={TradingGiftingAckOptions.NoTradingGifting}
            label={translate('Option.NotImplementedTradingGifting')}
          />
          <Radio
            value={TradingGiftingAckOptions.WithTradingGifting}
            label={translate('Option.ImplementedTradingGiftingWithChecks')}
          />
        </RadioGroup>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small padding-top-medium small:flex-row'>
        <Button
          variant='Emphasis'
          className='fill small:basis-0'
          size='Medium'
          onClick={handleContinue}
          isLoading={isTransitioning}
          isDisabled={!tradingGiftingAck || isTransitioning}>
          {translate('Action.Continue')}
        </Button>
        <Button
          variant='Standard'
          className='fill small:basis-0'
          size='Medium'
          onClick={onClose}
          isDisabled={isTransitioning}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedDialogContent = withTranslation(GiftingTradingAcknowledgementDialogContentV2, [
  TranslationNamespace.ManagedPricing,
]);

/**
 * Foundation-based gifting/trading acknowledgement dialog. Should be used when required
 * for enabling developer products.
 *
 * `onConfirm` is invoked after the user makes a selection and the acknowledgement is
 * persisted via `useGiftingTradingAcknowledgementSelection.accept`. Use this to chain
 * the next step (for example, opening the managed pricing acknowledgement dialog).
 */
export function openGiftingTradingAcknowledgementDialogV2(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedDialogContent {...params} onClose={closeDialog} />,
  });
}

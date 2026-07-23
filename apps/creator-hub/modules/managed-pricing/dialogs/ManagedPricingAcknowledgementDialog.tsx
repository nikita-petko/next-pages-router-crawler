import { useState } from 'react';
import {
  Button,
  Checkbox,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ROBLOX_TERMS_OF_USE } from '@modules/miscellaneous/common/constants/linkConstants';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { Link } from '@modules/monetization-shared/link';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useOnboardManagedPricing } from '../onboarding/hooks/useOnboardManagedPricing';

type Props = {
  universeId: number;
  showEnableEligiblePasses?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose: () => void;
};

function ManagedPricingAcknowledgementDialogContent({
  universeId,
  showEnableEligiblePasses = false,
  onConfirm,
  onClose,
}: Props) {
  const { translate, translateHTML } = useTranslation();

  const { onboardManagedPricing } = useOnboardManagedPricing({ universeId });

  // Need a separate pending state to account for confirmation flow
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const [shouldEnableEligiblePasses, setShouldEnableEligiblePasses] =
    useState<boolean>(showEnableEligiblePasses);

  const handleAgree = async () => {
    setIsTransitioning(true);

    const { updatedItemsCount } = await onboardManagedPricing({
      enableEligiblePasses: shouldEnableEligiblePasses,
    });

    if (updatedItemsCount > 0) {
      const message = pluralize(
        updatedItemsCount,
        translate('Message.SuccessfullyUpdatedSingleItem'),
        translate('Message.SuccessfullyUpdatedMultipleItems', {
          count: updatedItemsCount.toString(),
        }),
      );

      toast({ title: message });
    }

    onClose();

    await onConfirm?.();
  };

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-medium margin-y-none padding-bottom-xsmall'>
          {translate('Heading.OnboardingAcknowledgement')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>
          {translateHTML(
            'Message.ManagedPricingAcknowledgement',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link href={ROBLOX_TERMS_OF_USE} target='_blank'>
                    {chunks}
                  </Link>
                ),
              },
            ],
            { lineBreak: <br /> },
          )}
        </span>
        {showEnableEligiblePasses && (
          <Checkbox
            size='Medium'
            placement='Start'
            defaultChecked
            isChecked={shouldEnableEligiblePasses}
            onCheckedChange={(checked) => setShouldEnableEligiblePasses(checked === true)}
            label={translate('Label.EnableAllEligiblePasses')}
            className='padding-top-medium'
          />
        )}
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small padding-top-medium small:flex-row'>
        <Button
          variant='Emphasis'
          className='fill small:basis-0'
          size='Medium'
          onClick={handleAgree}
          isLoading={isTransitioning}
          isDisabled={isTransitioning}>
          {translate('Action.Agree')}
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

const TranslatedDialogContent = withTranslation(ManagedPricingAcknowledgementDialogContent, [
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);

/**
 * Entrypoint for managed pricing acknowledgement dialog used on all other product pages
 */
export function openManagedPricingAcknowledgementDialog(
  params: Omit<Props, 'onClose' | 'showEnableEligiblePasses'>,
) {
  openDialog({
    content: <TranslatedDialogContent {...params} onClose={closeDialog} />,
  });
}

/**
 * Entrypoint for managed pricing onboarding used on Managed Pricing Onboarding Landing.
 * Note we're intentionally splitting this out to hide the `showEnableEligiblePasses` option from the public API
 */
export function openManagedPricingOnboardingDialog(params: Pick<Props, 'universeId'>) {
  openDialog({
    content: <TranslatedDialogContent {...params} onClose={closeDialog} showEnableEligiblePasses />,
  });
}

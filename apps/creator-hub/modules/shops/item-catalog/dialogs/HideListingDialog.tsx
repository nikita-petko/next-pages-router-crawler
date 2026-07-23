import { useCallback } from 'react';
import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { pluralize } from '@modules/monetization-shared/pluralize';

type Props = {
  /** Number of items being hidden. 1 (or less) renders the Figma single-item copy; >1 pluralises. */
  count: number;
  onConfirm: () => void;
  onClose: () => void;
};

function HideListingDialogContent({ count, onConfirm, onClose }: Props) {
  const { translate } = useTranslation();

  // Clamp to 1 so an empty/zero selection still renders the singular copy (defensive).
  const safeCount = Math.max(count, 1);
  const title = pluralize(
    safeCount,
    translate('Heading.HideListingSingle'),
    translate('Heading.HideListingMultiple', {
      count: count.toString(),
    }),
  );
  const body = pluralize(
    safeCount,
    translate('Message.HideListingWarningSingle'),
    translate('Message.HideListingWarningMultiple'),
  );

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {title}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>{body}</span>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <Button
          variant='Alert'
          size='Medium'
          className='fill small:basis-0'
          onClick={handleConfirm}>
          {translate('Action.Hide')}
        </Button>
        <Button variant='Standard' size='Medium' className='fill small:basis-0' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedHideListingDialogContent = withTranslation(HideListingDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

export function openHideListingDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedHideListingDialogContent {...params} onClose={closeDialog} />,
  });
}

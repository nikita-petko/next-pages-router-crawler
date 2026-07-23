import { useCallback } from 'react';
import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';

type Props = {
  onConfirm: () => void;
  onClose: () => void;
};

function PublishShopDialogContent({ onConfirm, onClose }: Props) {
  const { translate } = useTranslation();

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate('Heading.Publish')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>
          {translate('Description.Publish')}
        </span>
      </DialogBody>
      <DialogFooter className='flex justify-end gap-small'>
        <Button variant='Emphasis' size='Medium' onClick={handleConfirm}>
          {translate('Action.Publish')}
        </Button>
        <Button variant='Standard' size='Medium' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedPublishShopDialogContent = withTranslation(PublishShopDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

export function openPublishShopDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedPublishShopDialogContent {...params} onClose={closeDialog} />,
  });
}

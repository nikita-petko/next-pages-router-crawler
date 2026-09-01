import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  ProgressCircle,
} from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type CreatorPitchImageRejectedOptionsModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  onEdit: () => void;
  onSendRequest: () => void;
  isLoading?: boolean;
};

const CreatorPitchImageRejectedOptionsModal: FunctionComponent<
  CreatorPitchImageRejectedOptionsModalProps
> = ({ isOpen, closeModal, onEdit, onSendRequest, isLoading = false }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeModal();
      }
    },
    [closeModal],
  );

  return (
    <Dialog
      open={isOpen}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}
      onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Action.TakeAction')}
          </DialogTitle>
          {isLoading ? (
            <div className='flex justify-center items-center padding-large'>
              <ProgressCircle
                variant='Indeterminate'
                size='Medium'
                ariaLabel={translate('Label.Loading')}
              />
            </div>
          ) : (
            <span className='text-body-medium content-default margin-none'>
              {translate('Description.CreatorPitchImageRejectedTakeAction')}
            </span>
          )}
        </DialogBody>
        {isLoading ? null : (
          <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
            <Button variant='contained' color='primaryBrand' onClick={onEdit}>
              {translate('Action.Edit')}
            </Button>
            <Button variant='contained' color='secondary' onClick={onSendRequest}>
              {translate('Action.SendRequest')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatorPitchImageRejectedOptionsModal;

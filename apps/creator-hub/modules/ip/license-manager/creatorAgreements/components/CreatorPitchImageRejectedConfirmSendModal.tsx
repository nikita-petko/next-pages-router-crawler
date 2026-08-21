import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { CreatorPitchAttachmentErrorType } from '@modules/licenses/utils/constants';
import type { CreatorPitchAttachment } from '@modules/licenses/utils/creatorPitchAttachmentTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useCreatorSendPitchImageRequestMutation } from '../hooks/useCreatorSendPitchImageRequestMutation';

type CreatorPitchImageRejectedConfirmSendModalProps = {
  agreementId: string;
  isOpen: boolean;
  closeModal: () => void;
  pitchImageAttachments: CreatorPitchAttachment[];
  onBack: () => void;
};

const getNonModeratedPitchImageAssetIds = (attachments: CreatorPitchAttachment[]): number[] =>
  attachments
    .filter((attachment) => attachment.errorType !== CreatorPitchAttachmentErrorType.Moderated)
    .flatMap((attachment) => (attachment.assetId != null ? [attachment.assetId] : []));

const CreatorPitchImageRejectedConfirmSendModal: FunctionComponent<
  CreatorPitchImageRejectedConfirmSendModalProps
> = ({ agreementId, isOpen, closeModal, pitchImageAttachments, onBack }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { mutateAsync: sendPitchImageRequest, isPending: isSendingRequest } =
    useCreatorSendPitchImageRequestMutation(agreementId);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSendingRequest) {
        closeModal();
      }
    },
    [closeModal, isSendingRequest],
  );

  const handleBack = useCallback(() => {
    if (!isSendingRequest) {
      onBack();
    }
  }, [isSendingRequest, onBack]);

  const handleConfirmSend = useCallback(async () => {
    try {
      await sendPitchImageRequest(getNonModeratedPitchImageAssetIds(pitchImageAttachments));
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeModal();
    }
  }, [closeModal, enqueueErrorSnackbar, pitchImageAttachments, sendPitchImageRequest]);

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
            {translate('Action.SendRequest')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Description.ConfirmSendPitchImageRequest')}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button
            variant='contained'
            color='primaryBrand'
            onClick={handleConfirmSend}
            disabled={isSendingRequest}>
            {translate('Action.Send')}
          </Button>
          <Button
            variant='contained'
            color='secondary'
            onClick={handleBack}
            disabled={isSendingRequest}>
            {translate('Action.Back')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorPitchImageRejectedConfirmSendModal;

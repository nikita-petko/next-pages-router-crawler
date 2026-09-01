import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Button } from '@rbx/ui';
import CreatorPitchAttachments from '@modules/licenses/components/CreatorPitchAttachments';
import useCreatorPitchAttachments from '@modules/licenses/hooks/useCreatorPitchAttachments';
import type { CreatorPitchAttachment } from '@modules/licenses/utils/creatorPitchAttachmentTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useCreatorSendPitchImageRequestMutation } from '../hooks/useCreatorSendPitchImageRequestMutation';

type CreatorPitchImageRejectedEditImagesModalProps = {
  agreementId: string;
  isOpen: boolean;
  closeModal: () => void;
  pitchImageAttachments: CreatorPitchAttachment[];
  isRequired: boolean;
  onBack?: () => void;
};

const CreatorPitchImageRejectedEditImagesModal: FunctionComponent<
  CreatorPitchImageRejectedEditImagesModalProps
> = ({ agreementId, isOpen, closeModal, pitchImageAttachments, isRequired, onBack }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { mutateAsync: sendPitchImageRequest, isPending: isSendingRequest } =
    useCreatorSendPitchImageRequestMutation(agreementId);
  const [editableAttachments, setEditableAttachments] =
    useState<CreatorPitchAttachment[]>(pitchImageAttachments);
  const { onChange, showErrors, validateForNext } = useCreatorPitchAttachments({
    attachments: editableAttachments,
    onAttachmentsChange: setEditableAttachments,
    isRequired,
  });

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
      onBack?.();
    }
  }, [isSendingRequest, onBack]);

  const handleSendRequest = useCallback(async () => {
    const canProceed = await validateForNext();
    if (!canProceed) {
      return;
    }

    try {
      await sendPitchImageRequest(
        editableAttachments.flatMap((attachment) =>
          attachment.assetId != null ? [attachment.assetId] : [],
        ),
      );
      closeModal();
    } catch {
      // Stay open so the creator keeps their edits and can retry.
      enqueueErrorSnackbar();
    }
  }, [
    closeModal,
    editableAttachments,
    enqueueErrorSnackbar,
    sendPitchImageRequest,
    validateForNext,
  ]);

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
            {translate('Heading.EditImages')}
          </DialogTitle>
          <CreatorPitchAttachments
            attachments={editableAttachments}
            onChange={onChange}
            showErrors={showErrors}
            isRequired={isRequired}
          />
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button
            variant='contained'
            color='primaryBrand'
            onClick={handleSendRequest}
            disabled={isSendingRequest}>
            {translate('Action.SendRequest')}
          </Button>
          {onBack != null ? (
            <Button
              variant='contained'
              color='secondary'
              onClick={handleBack}
              disabled={isSendingRequest}>
              {translate('Action.Back')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorPitchImageRejectedEditImagesModal;

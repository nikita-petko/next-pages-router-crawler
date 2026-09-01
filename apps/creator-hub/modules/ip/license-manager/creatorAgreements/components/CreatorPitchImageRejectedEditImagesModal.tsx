import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import CreatorPitchAttachments from '@modules/licenses/components/CreatorPitchAttachments';
import useCreatorPitchAttachments from '@modules/licenses/hooks/useCreatorPitchAttachments';
import type { CreatorPitchAttachment } from '@modules/licenses/utils/creatorPitchAttachmentTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useCreatorSendPitchImageRequestMutation } from '../hooks/useCreatorSendPitchImageRequestMutation';
import { useGetCreatorPitchImageAttachments } from '../hooks/useGetCreatorPitchImageAttachments';

type CreatorPitchImageRejectedEditImagesModalProps = {
  agreementId: string;
  isOpen: boolean;
  closeModal: () => void;
  isRequired: boolean;
};

type CreatorPitchImageRejectedEditImagesFormProps = {
  currentAttachments: CreatorPitchAttachment[];
  isRequired: boolean;
  isSendingRequest: boolean;
  onSendRequest: (attachments: CreatorPitchAttachment[]) => Promise<void>;
};

/**
 * The parent keeps this mounted and toggles `isOpen`. The form unmounts while closed so a later
 * open starts from freshly fetched, unedited attachments.
 */
const CreatorPitchImageRejectedEditImagesModal: FunctionComponent<
  CreatorPitchImageRejectedEditImagesModalProps
> = ({ agreementId, isOpen, closeModal, isRequired }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { mutateAsync: sendPitchImageRequest, isPending: isSendingRequest } =
    useCreatorSendPitchImageRequestMutation(agreementId);
  const {
    data: attachmentsResult,
    isPending: isLoadingAttachments,
    isError: isAttachmentsError,
    isSuccess,
  } = useGetCreatorPitchImageAttachments({ agreementId, enabled: isOpen });
  const currentAttachments = attachmentsResult?.attachments;
  const hasReportedAttachmentsError = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasReportedAttachmentsError.current = false;
      return;
    }

    if (!isAttachmentsError || hasReportedAttachmentsError.current) {
      return;
    }

    hasReportedAttachmentsError.current = true;
    enqueueErrorSnackbar('Error.Generic');
    closeModal();
  }, [closeModal, enqueueErrorSnackbar, isAttachmentsError, isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSendingRequest) {
        closeModal();
      }
    },
    [closeModal, isSendingRequest],
  );

  const handleSendRequest = useCallback(
    async (attachments: CreatorPitchAttachment[]) => {
      try {
        await sendPitchImageRequest(
          attachments.flatMap((attachment) =>
            attachment.assetId != null ? [attachment.assetId] : [],
          ),
        );
        closeModal();
      } catch {
        // Stay open so the creator keeps their edits and can retry.
        enqueueErrorSnackbar();
      }
    },
    [closeModal, enqueueErrorSnackbar, sendPitchImageRequest],
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
        {isOpen && isSuccess && currentAttachments != null ? (
          <CreatorPitchImageRejectedEditImagesForm
            currentAttachments={currentAttachments}
            isRequired={isRequired}
            isSendingRequest={isSendingRequest}
            onSendRequest={handleSendRequest}
          />
        ) : (
          <DialogBody className='flex flex-col gap-y-xsmall'>
            <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
              {translate('Heading.EditImages')}
            </DialogTitle>
            {isOpen && isLoadingAttachments ? (
              <div className='flex justify-center items-center padding-large'>
                <ProgressCircle
                  variant='Indeterminate'
                  size='Medium'
                  ariaLabel={translate('Label.Loading')}
                />
              </div>
            ) : null}
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CreatorPitchImageRejectedEditImagesForm: FunctionComponent<
  CreatorPitchImageRejectedEditImagesFormProps
> = ({ currentAttachments, isRequired, isSendingRequest, onSendRequest }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const [editedAttachments, setEditedAttachments] =
    useState<CreatorPitchAttachment[]>(currentAttachments);
  const { onChange, showErrors, validateForNext } = useCreatorPitchAttachments({
    attachments: editedAttachments,
    onAttachmentsChange: setEditedAttachments,
    isRequired,
  });

  const handleSendRequest = useCallback(async () => {
    const canProceed = await validateForNext();
    if (!canProceed) {
      return;
    }

    await onSendRequest(editedAttachments);
  }, [editedAttachments, onSendRequest, validateForNext]);

  return (
    <>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate('Heading.EditImages')}
        </DialogTitle>
        <CreatorPitchAttachments
          attachments={editedAttachments}
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
      </DialogFooter>
    </>
  );
};

export default CreatorPitchImageRejectedEditImagesModal;

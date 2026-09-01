import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useGetCreatorPitchImageAttachments } from '../hooks/useGetCreatorPitchImageAttachments';
import CreatorPitchImageRejectedConfirmSendModal from './CreatorPitchImageRejectedConfirmSendModal';
import CreatorPitchImageRejectedEditImagesModal from './CreatorPitchImageRejectedEditImagesModal';
import CreatorPitchImageRejectedOptionsModal from './CreatorPitchImageRejectedOptionsModal';

type CreatorPitchImageRejectedTakeActionModalProps = {
  agreementId: string;
  isOpen: boolean;
  closeModal: () => void;
  isRequired: boolean;
};

enum PitchTakeActionModalView {
  Options = 'options',
  EditImages = 'editImages',
  ConfirmSend = 'confirmSend',
}

const getInitialView = (isRequired: boolean): PitchTakeActionModalView =>
  isRequired ? PitchTakeActionModalView.EditImages : PitchTakeActionModalView.Options;

const CreatorPitchImageRejectedTakeActionModal: FunctionComponent<
  CreatorPitchImageRejectedTakeActionModalProps
> = ({ agreementId, isOpen, closeModal, isRequired }) => {
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const [view, setView] = useState(() => getInitialView(isRequired));
  const hasNotifiedAttachmentError = useRef(false);
  const {
    data: pitchImageAttachmentsResult,
    isPending: isPitchImageAttachmentsPending,
    isError: isPitchImageAttachmentsError,
  } = useGetCreatorPitchImageAttachments({
    agreementId,
    enabled: isOpen,
  });
  const pitchImageAttachments = pitchImageAttachmentsResult?.attachments;

  const handleCloseModal = useCallback(() => {
    setView(getInitialView(isRequired));
    closeModal();
  }, [closeModal, isRequired]);

  useEffect(() => {
    if (!isOpen) {
      hasNotifiedAttachmentError.current = false;
      return;
    }

    if (!isPitchImageAttachmentsError || hasNotifiedAttachmentError.current) {
      return;
    }

    hasNotifiedAttachmentError.current = true;
    enqueueErrorSnackbar('Error.Generic');
    handleCloseModal();
  }, [enqueueErrorSnackbar, handleCloseModal, isOpen, isPitchImageAttachmentsError]);

  const handleEdit = useCallback(() => {
    setView(PitchTakeActionModalView.EditImages);
  }, []);

  const handleBackToOptions = useCallback(() => {
    setView(PitchTakeActionModalView.Options);
  }, []);

  const handleSendRequest = useCallback(() => {
    setView(PitchTakeActionModalView.ConfirmSend);
  }, []);

  // The edit view owns the in-progress attachment list and its validation errors, so it has to
  // unmount while closed to reopen from freshly fetched attachments.
  if (isOpen && view === PitchTakeActionModalView.EditImages && pitchImageAttachments != null) {
    return (
      <CreatorPitchImageRejectedEditImagesModal
        agreementId={agreementId}
        isOpen={isOpen}
        closeModal={handleCloseModal}
        pitchImageAttachments={pitchImageAttachments}
        isRequired={isRequired}
        onBack={isRequired ? undefined : handleBackToOptions}
      />
    );
  }

  if (
    !isRequired &&
    view === PitchTakeActionModalView.ConfirmSend &&
    pitchImageAttachments != null
  ) {
    return (
      <CreatorPitchImageRejectedConfirmSendModal
        agreementId={agreementId}
        isOpen={isOpen}
        closeModal={handleCloseModal}
        pitchImageAttachments={pitchImageAttachments}
        onBack={handleBackToOptions}
      />
    );
  }

  return (
    <CreatorPitchImageRejectedOptionsModal
      isOpen={isOpen}
      closeModal={handleCloseModal}
      onEdit={handleEdit}
      onSendRequest={handleSendRequest}
      isLoading={isPitchImageAttachmentsPending || pitchImageAttachments == null}
    />
  );
};

export default CreatorPitchImageRejectedTakeActionModal;

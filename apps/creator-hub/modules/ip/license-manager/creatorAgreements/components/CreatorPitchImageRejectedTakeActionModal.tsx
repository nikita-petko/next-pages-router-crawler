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
};

enum PitchTakeActionModalView {
  Options = 'options',
  EditImages = 'editImages',
  ConfirmSend = 'confirmSend',
}

const CreatorPitchImageRejectedTakeActionModal: FunctionComponent<
  CreatorPitchImageRejectedTakeActionModalProps
> = ({ agreementId, isOpen, closeModal }) => {
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const [view, setView] = useState(PitchTakeActionModalView.Options);
  const hasNotifiedAttachmentError = useRef(false);
  const {
    data: pitchImageAttachments,
    isPending: isPitchImageAttachmentsPending,
    isError: isPitchImageAttachmentsError,
  } = useGetCreatorPitchImageAttachments({
    agreementId,
    enabled: isOpen,
  });

  const handleCloseModal = useCallback(() => {
    setView(PitchTakeActionModalView.Options);
    closeModal();
  }, [closeModal]);

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

  if (view === PitchTakeActionModalView.EditImages && pitchImageAttachments != null) {
    return (
      <CreatorPitchImageRejectedEditImagesModal
        agreementId={agreementId}
        isOpen={isOpen}
        closeModal={handleCloseModal}
        pitchImageAttachments={pitchImageAttachments}
        onBack={handleBackToOptions}
      />
    );
  }

  if (view === PitchTakeActionModalView.ConfirmSend && pitchImageAttachments != null) {
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

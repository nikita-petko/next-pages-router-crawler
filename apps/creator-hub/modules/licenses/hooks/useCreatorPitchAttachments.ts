import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import {
  type CreatorPitchAttachment,
  hasBlockingCreatorPitchAttachments,
} from '../utils/creatorPitchAttachmentTypes';

interface UseCreatorPitchAttachmentsParams {
  attachments: CreatorPitchAttachment[];
  onAttachmentsChange: Dispatch<SetStateAction<CreatorPitchAttachment[]>>;
}

const useCreatorPitchAttachments = ({
  attachments,
  onAttachmentsChange,
}: UseCreatorPitchAttachmentsParams) => {
  const { ready, value: isImageAttachmentEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );
  const isEnabled = ready && isImageAttachmentEnabled;
  const [showErrors, setShowErrors] = useState(false);

  const onChange = useCallback(
    (
      next:
        | CreatorPitchAttachment[]
        | ((previous: CreatorPitchAttachment[]) => CreatorPitchAttachment[]),
    ) => {
      setShowErrors(false);
      onAttachmentsChange(next);
    },
    [onAttachmentsChange],
  );

  const validateForNext = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) {
      return true;
    }

    const canProceed = !hasBlockingCreatorPitchAttachments(attachments);

    if (!canProceed) {
      setShowErrors(true);
      return false;
    }

    setShowErrors(false);
    return true;
  }, [attachments, isEnabled]);

  return {
    isEnabled,
    onChange,
    showErrors,
    validateForNext,
  };
};

export default useCreatorPitchAttachments;

import type { FunctionComponent } from 'react';
import { useId } from 'react';
import { Button } from '@rbx/foundation-ui';
import { FormHelperText, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import useCreatorPitchAttachmentLabels from '../hooks/useCreatorPitchAttachmentLabels';
import useCreatorPitchAttachmentUpload from '../hooks/useCreatorPitchAttachmentUpload';
import { CREATOR_PITCH_ATTACHMENT_ACCEPT } from '../utils/constants';
import {
  type CreatorPitchAttachment,
  type CreatorPitchAttachmentsOnChange,
  hasUsableCreatorPitchAttachments,
} from '../utils/creatorPitchAttachmentTypes';
import ManagePitchAttachments from './ManagePitchAttachments';

interface CreatorPitchAttachmentsProps {
  attachments: CreatorPitchAttachment[];
  onChange: CreatorPitchAttachmentsOnChange;
  showErrors?: boolean;
  isRequired?: boolean;
}

/**
 * Upload control for supporting images on the license "describe your intent" step.
 * Selected images are uploaded immediately via the assets upload API; previews use asset thumbnails.
 */
const CreatorPitchAttachments: FunctionComponent<CreatorPitchAttachmentsProps> = ({
  attachments,
  onChange,
  showErrors = false,
  isRequired = false,
}) => {
  const { user } = useAuthentication();
  const inputId = useId();
  const { descriptionText, limitsText, requiredErrorText, uploadButtonLabel } =
    useCreatorPitchAttachmentLabels();
  const showRequiredError =
    showErrors && isRequired && !hasUsableCreatorPitchAttachments(attachments);

  const { canUpload, handleFilesSelected, handleRemove } = useCreatorPitchAttachmentUpload({
    attachments,
    onChange,
    userId: user?.id,
  });

  return (
    <div className='flex flex-col gap-medium width-full' data-testid='creator-pitch-attachments'>
      <Typography variant='body1'>{descriptionText}</Typography>

      <div className='flex flex-col items-start gap-xsmall'>
        <div className='relative width-fit'>
          <Button
            type='button'
            variant='Standard'
            size='Medium'
            className='width-fit pointer-events-none'
            isDisabled={!canUpload}
            tabIndex={-1}
            aria-hidden
            data-testid='creator-pitch-attachments-upload'>
            {uploadButtonLabel}
          </Button>
          <input
            id={inputId}
            type='file'
            multiple
            accept={CREATOR_PITCH_ATTACHMENT_ACCEPT}
            aria-label={uploadButtonLabel}
            aria-invalid={showRequiredError}
            required={isRequired}
            disabled={!canUpload}
            onChange={handleFilesSelected}
            className='absolute inset-[0] width-full height-full opacity-[0] cursor-pointer disabled:cursor-not-allowed'
            data-testid='creator-pitch-attachments-input'
          />
        </div>
        <FormHelperText>{limitsText}</FormHelperText>
        {showRequiredError ? (
          <p
            className='text-caption-medium content-system-alert margin-none'
            data-testid='creator-pitch-attachments-required-error'>
            {requiredErrorText}
          </p>
        ) : null}
      </div>

      <div className='max-height-[452px] scroll-y'>
        <ManagePitchAttachments
          attachments={attachments}
          showErrors={showErrors}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
};

export default CreatorPitchAttachments;

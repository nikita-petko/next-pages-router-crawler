import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import useCreatorPitchAttachmentLabels from '../hooks/useCreatorPitchAttachmentLabels';
import {
  hasCreatorPitchAttachmentError,
  type CreatorPitchAttachment,
} from '../utils/creatorPitchAttachmentTypes';
import CreatorPitchAttachmentPreview from './CreatorPitchAttachmentPreview';

interface ManagePitchAttachmentRowProps {
  attachment: CreatorPitchAttachment;
  showErrors: boolean;
  onRemove: (attachmentId: string) => void;
}

const ManagePitchAttachmentRow: FunctionComponent<ManagePitchAttachmentRowProps> = ({
  attachment,
  showErrors,
  onRemove,
}) => {
  const { deleteAriaLabel, getAttachmentErrorText } = useCreatorPitchAttachmentLabels();
  const hasAttachmentError = hasCreatorPitchAttachmentError(attachment);
  const showErrorHighlight = showErrors && hasAttachmentError;
  const errorLabel = getAttachmentErrorText(attachment);

  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [attachment.id, onRemove]);

  return (
    <div
      className='flex items-center justify-between gap-medium padding-y-large [border-bottom:var(--stroke-standard)_solid_var(--color-stroke-default)]'
      data-testid='creator-pitch-attachment-row'>
      <div className='flex flex-col gap-medium min-width-0'>
        <CreatorPitchAttachmentPreview
          attachment={attachment}
          showErrorHighlight={showErrorHighlight}
        />
        {hasAttachmentError && (
          <p
            className='text-caption-medium content-system-alert margin-none'
            data-testid='creator-pitch-attachment-error-message'>
            {errorLabel}
          </p>
        )}
      </div>
      <IconButton
        variant='Utility'
        size='Medium'
        icon='icon-regular-trash-can'
        ariaLabel={deleteAriaLabel}
        onClick={handleRemove}
        data-testid='creator-pitch-attachment-delete'
      />
    </div>
  );
};

interface ManagePitchAttachmentsProps {
  attachments: CreatorPitchAttachment[];
  showErrors?: boolean;
  onRemove: (attachmentId: string) => void;
}

const ManagePitchAttachments: FunctionComponent<ManagePitchAttachmentsProps> = ({
  attachments,
  showErrors = false,
  onRemove,
}) => {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col width-full'>
      {attachments.map((attachment) => (
        <ManagePitchAttachmentRow
          key={attachment.id}
          attachment={attachment}
          showErrors={showErrors}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default ManagePitchAttachments;

import type { Dispatch, SetStateAction } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import { Grid } from '@rbx/ui';
import useCreatorPitchAttachments from '../hooks/useCreatorPitchAttachments';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';
import CreatorPitchAttachments from './CreatorPitchAttachments';

export interface CreatorPitchAttachmentsFieldHandle {
  validateForNext: () => Promise<boolean>;
}

interface CreatorPitchAttachmentsFieldProps {
  attachments: CreatorPitchAttachment[];
  onAttachmentsChange: Dispatch<SetStateAction<CreatorPitchAttachment[]>>;
  isRequired?: boolean;
}

/**
 * Pitch attachment upload field for the license apply flow intent step.
 * Owns validation and feature-flag gating; exposes validateForNext to the parent step.
 */
const CreatorPitchAttachmentsField = forwardRef<
  CreatorPitchAttachmentsFieldHandle,
  CreatorPitchAttachmentsFieldProps
>(({ attachments, onAttachmentsChange, isRequired = false }, ref) => {
  const { isEnabled, onChange, showErrors, validateForNext } = useCreatorPitchAttachments({
    attachments,
    onAttachmentsChange,
    isRequired,
  });

  useImperativeHandle(ref, () => ({ validateForNext }), [validateForNext]);

  if (!isEnabled) {
    return null;
  }

  return (
    <Grid item>
      <CreatorPitchAttachments
        attachments={attachments}
        onChange={onChange}
        showErrors={showErrors}
        isRequired={isRequired}
      />
    </Grid>
  );
});

CreatorPitchAttachmentsField.displayName = 'CreatorPitchAttachmentsField';

export default CreatorPitchAttachmentsField;

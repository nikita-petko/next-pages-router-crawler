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
}

/**
 * Pitch attachment upload field for the license apply flow intent step.
 * Owns validation and feature-flag gating; exposes validateForNext to the parent step.
 */
const CreatorPitchAttachmentsField = forwardRef<
  CreatorPitchAttachmentsFieldHandle,
  CreatorPitchAttachmentsFieldProps
>(({ attachments, onAttachmentsChange }, ref) => {
  const { isEnabled, onChange, showErrors, validateForNext } = useCreatorPitchAttachments({
    attachments,
    onAttachmentsChange,
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
      />
    </Grid>
  );
});

CreatorPitchAttachmentsField.displayName = 'CreatorPitchAttachmentsField';

export default CreatorPitchAttachmentsField;

import type { FunctionComponent } from 'react';
import { useFlag } from '@rbx/flags';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';
import CreatorPitchAttachmentPreview from './CreatorPitchAttachmentPreview';

interface ViewPitchAttachmentsProps {
  attachments: CreatorPitchAttachment[];
}

/**
 * Read-only pitch attachment previews for the Review and Submit step.
 */
const ViewPitchAttachments: FunctionComponent<ViewPitchAttachmentsProps> = ({ attachments }) => {
  const { ready, value: isImageAttachmentEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );

  if (!ready || !isImageAttachmentEnabled) {
    return null;
  }

  return (
    <div
      className='flex [flex-wrap:wrap] gap-medium'
      data-testid='creator-pitch-attachments-review'>
      {attachments.map((attachment) => (
        <div key={attachment.id} data-testid='creator-pitch-attachment-review-item'>
          <CreatorPitchAttachmentPreview attachment={attachment} />
        </div>
      ))}
    </div>
  );
};

export default ViewPitchAttachments;

import type { FunctionComponent } from 'react';
import { useFlag } from '@rbx/flags';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import ImageInspector from '@modules/ip/license-manager/agreements/components/ImageInspector';
import usePitchImageAttachmentsInspector from '../hooks/usePitchImageAttachmentsInspector';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';
import CreatorPitchAttachmentPreview from './CreatorPitchAttachmentPreview';

interface ViewPitchAttachmentsProps {
  attachments: CreatorPitchAttachment[];
  /** Header shown in the screenshot viewer. Empty when omitted. */
  parentTitle?: string;
  /** Base URL for share links; `inspect=<assetId>` is appended. No share control when empty. */
  imgSharingBaseUrl?: string;
  /** Serialized access context for fetching creator-owned pitch images via asset delivery. */
  accessContext?: string;
}

const AttachmentPreviewList: FunctionComponent<{
  attachments: CreatorPitchAttachment[];
  onAttachmentClick?: (assetId: number) => void;
}> = ({ attachments, onAttachmentClick }) => (
  <div className='flex [flex-wrap:wrap] gap-medium' data-testid='creator-pitch-attachments-review'>
    {attachments.map((attachment) => {
      const assetId = attachment.assetId;
      const handleClick =
        assetId != null && onAttachmentClick != null ? () => onAttachmentClick(assetId) : null;

      return (
        <div key={attachment.id} data-testid='creator-pitch-attachment-review-item'>
          {handleClick != null ? (
            <button
              type='button'
              aria-label={attachment.fileName}
              className='block padding-none stroke-none [background:transparent] cursor-pointer'
              onClick={handleClick}>
              <CreatorPitchAttachmentPreview attachment={attachment} />
            </button>
          ) : (
            <CreatorPitchAttachmentPreview attachment={attachment} />
          )}
        </div>
      );
    })}
  </div>
);

const PitchImageAttachmentsWithInspector: FunctionComponent<{
  attachments: CreatorPitchAttachment[];
  parentTitle: string;
  imgSharingBaseUrl?: string;
  accessContext?: string;
}> = ({ attachments, parentTitle, imgSharingBaseUrl, accessContext }) => {
  const {
    activeInspectorImages,
    canShare,
    getShareUrl,
    handleAttachmentClick,
    handleInspectorClose,
    handleLinkCopied,
    initialInspectorIndex,
  } = usePitchImageAttachmentsInspector({ attachments, imgSharingBaseUrl, accessContext });

  return (
    <>
      <AttachmentPreviewList attachments={attachments} onAttachmentClick={handleAttachmentClick} />
      {activeInspectorImages != null && (
        <ImageInspector
          images={activeInspectorImages}
          title={parentTitle}
          initialIndex={initialInspectorIndex}
          getShareUrl={canShare ? getShareUrl : undefined}
          onLinkCopied={canShare ? handleLinkCopied : undefined}
          onClose={handleInspectorClose}
        />
      )}
    </>
  );
};

/**
 * Read-only pitch attachment previews for review. Opens the screenshot viewer on click.
 * Pass `parentTitle` for the viewer header and `imgSharingBaseUrl` to append `inspect=<assetId>`
 * for shareable links.
 */
const ViewPitchAttachments: FunctionComponent<ViewPitchAttachmentsProps> = ({
  attachments,
  parentTitle,
  imgSharingBaseUrl,
  accessContext,
}) => {
  const { ready, value: isImageAttachmentEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );

  if (!ready || !isImageAttachmentEnabled) {
    return null;
  }

  const isInspectorEnabled =
    parentTitle != null || imgSharingBaseUrl != null || accessContext != null;
  if (!isInspectorEnabled) {
    return <AttachmentPreviewList attachments={attachments} />;
  }

  return (
    <PitchImageAttachmentsWithInspector
      attachments={attachments}
      parentTitle={parentTitle ?? ''}
      imgSharingBaseUrl={imgSharingBaseUrl}
      accessContext={accessContext}
    />
  );
};

export default ViewPitchAttachments;

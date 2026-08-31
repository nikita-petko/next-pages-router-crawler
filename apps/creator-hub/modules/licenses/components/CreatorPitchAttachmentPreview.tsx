import type { FunctionComponent } from 'react';
import { Icon, ProgressCircle, VisuallyHidden } from '@rbx/foundation-ui';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import useCreatorPitchAttachmentLabels from '../hooks/useCreatorPitchAttachmentLabels';
import { CreatorPitchAttachmentStatus } from '../utils/constants';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';

// oxlint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const ATTACHMENT_THUMBNAIL_SIZE = AssetThumbnailSize._768x432;

interface CreatorPitchAttachmentPreviewProps {
  attachment: CreatorPitchAttachment;
  showErrorHighlight?: boolean;
}

const CreatorPitchAttachmentPreview: FunctionComponent<CreatorPitchAttachmentPreviewProps> = ({
  attachment,
  showErrorHighlight = false,
}) => {
  const { getAttachmentErrorText, pendingModerationLabel, previewAlt, uploadingLabel } =
    useCreatorPitchAttachmentLabels();
  const errorLabel = getAttachmentErrorText(attachment);

  if (attachment.status === CreatorPitchAttachmentStatus.Uploading) {
    return (
      <div className='flex items-center justify-center width-[190px] aspect-16-9 radius-xsmall shrink-0 bg-surface-200'>
        <ProgressCircle size='Small' variant='Indeterminate' ariaLabel={uploadingLabel} />
      </div>
    );
  }

  if (attachment.status === CreatorPitchAttachmentStatus.PendingModeration) {
    return (
      <div
        className='flex items-center justify-center width-[190px] aspect-16-9 radius-xsmall shrink-0 bg-surface-200'
        data-testid='creator-pitch-attachment-pending-preview'>
        <VisuallyHidden>{pendingModerationLabel}</VisuallyHidden>
        <Icon name='icon-regular-clock' size='Medium' className='content-emphasis' aria-hidden />
      </div>
    );
  }

  if (attachment.status === CreatorPitchAttachmentStatus.Error) {
    return (
      <div
        className={`flex items-center justify-center width-[190px] aspect-16-9 radius-xsmall shrink-0 bg-surface-200 ${showErrorHighlight ? 'stroke-standard stroke-system-alert' : ''}`}
        data-testid={
          showErrorHighlight
            ? 'creator-pitch-attachment-error-highlighted'
            : 'creator-pitch-attachment-error-preview'
        }>
        <VisuallyHidden>{errorLabel}</VisuallyHidden>
        <Icon
          name='icon-regular-triangle-exclamation'
          size='Medium'
          className='content-emphasis'
          aria-hidden
        />
      </div>
    );
  }

  if (attachment.status === CreatorPitchAttachmentStatus.Ready && attachment.imageUrl != null) {
    return (
      <div className='relative width-[190px] aspect-16-9 radius-xsmall clip shrink-0 bg-surface-200'>
        <img
          src={attachment.imageUrl}
          alt={previewAlt}
          className='absolute inset-[0] width-full height-full [object-fit:cover] block radius-xsmall'
        />
      </div>
    );
  }

  if (attachment.status === CreatorPitchAttachmentStatus.Ready && attachment.assetId != null) {
    return (
      // Parent owns size/aspect-ratio. Thumbnail2d's default paddingTop hack is bypassed via
      // position:static so the image can fill this box (same pattern as ListingItem).
      <div className='relative width-[190px] aspect-16-9 radius-xsmall clip shrink-0 bg-surface-200'>
        <Thumbnail2d
          targetId={attachment.assetId}
          type={ThumbnailTypes.assetThumbnail}
          alt={previewAlt}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground={false}
          size={ATTACHMENT_THUMBNAIL_SIZE}
          containerClass='!static !padding-none width-full height-full block'
          imgClassName='absolute inset-[0] width-full height-full [object-fit:cover] block radius-xsmall'
        />
      </div>
    );
  }

  return (
    <div className='flex items-center gap-small width-[190px] height-100 shrink-0'>
      <Icon name='icon-regular-file-box' size='Medium' />
      <span className='text-body-medium content-muted text-truncate-end text-no-wrap'>
        {attachment.fileName}
      </span>
    </div>
  );
};

export default CreatorPitchAttachmentPreview;

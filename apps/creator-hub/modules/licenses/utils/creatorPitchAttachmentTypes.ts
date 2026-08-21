import { CreatorPitchAttachmentStatus, type CreatorPitchAttachmentErrorType } from './constants';

export { CreatorPitchAttachmentErrorType, CreatorPitchAttachmentStatus } from './constants';

export type CreatorPitchAttachment = {
  id: string;
  fileName: string;
  status: CreatorPitchAttachmentStatus;
  operationId?: string;
  assetId?: number;
  errorType?: CreatorPitchAttachmentErrorType;
};

export type CreatorPitchAttachmentsOnChange = (
  next:
    | CreatorPitchAttachment[]
    | ((previous: CreatorPitchAttachment[]) => CreatorPitchAttachment[]),
) => void;

export function hasCreatorPitchAttachmentError(attachment: CreatorPitchAttachment): boolean {
  return attachment.status === CreatorPitchAttachmentStatus.Error;
}

export function isCreatorPitchAttachmentBlocking(attachment: CreatorPitchAttachment): boolean {
  return (
    attachment.status === CreatorPitchAttachmentStatus.Uploading ||
    attachment.status === CreatorPitchAttachmentStatus.Error
  );
}

export function hasBlockingCreatorPitchAttachments(attachments: CreatorPitchAttachment[]): boolean {
  return attachments.some(isCreatorPitchAttachmentBlocking);
}

/**
 * Asset IDs safe to submit with a license application. An asset ID can exist on an attachment that
 * is still uploading or was rejected by moderation, so status — not just the presence of an ID —
 * decides what gets sent.
 */
export function getSubmittableCreatorPitchAttachmentAssetIds(
  attachments: CreatorPitchAttachment[],
): number[] {
  const assetIds = attachments.flatMap((attachment) =>
    attachment.assetId != null && !isCreatorPitchAttachmentBlocking(attachment)
      ? [attachment.assetId]
      : [],
  );

  return Array.from(new Set(assetIds));
}

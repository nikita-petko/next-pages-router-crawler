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

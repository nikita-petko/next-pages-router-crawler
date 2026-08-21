import { CreatorPitchAttachmentErrorType, CreatorPitchAttachmentStatus } from './constants';
import type { CreatorPitchAttachment } from './creatorPitchAttachmentTypes';
import {
  createCreatorPitchAttachmentId,
  isPitchAttachmentWithinSizeLimit,
} from './creatorPitchAttachmentValidation';

export const createCreatorPitchAttachmentFromFile = (file: File): CreatorPitchAttachment => {
  const id = createCreatorPitchAttachmentId();

  if (isPitchAttachmentWithinSizeLimit(file)) {
    return {
      id,
      fileName: file.name,
      status: CreatorPitchAttachmentStatus.Uploading,
    };
  }

  return {
    id,
    fileName: file.name,
    status: CreatorPitchAttachmentStatus.Error,
    errorType: CreatorPitchAttachmentErrorType.FileTooLarge,
  };
};

import {
  CREATOR_PITCH_ATTACHMENT_ACCEPTED_EXTENSIONS,
  CREATOR_PITCH_ATTACHMENT_ACCEPTED_MIME_TYPES,
  MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES,
} from './constants';

export const createCreatorPitchAttachmentId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const isPitchAttachmentWithinSizeLimit = (file: File): boolean =>
  file.size <= MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES;

export const isAcceptedPitchAttachment = (file: File): boolean => {
  if (CREATOR_PITCH_ATTACHMENT_ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }
  // Browsers often omit MIME for TGA/BMP; fall back to the file extension.
  const extensionIndex = file.name.lastIndexOf('.');
  if (extensionIndex < 0) {
    return false;
  }
  return CREATOR_PITCH_ATTACHMENT_ACCEPTED_EXTENSIONS.has(
    file.name.slice(extensionIndex).toLowerCase(),
  );
};

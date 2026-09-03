import {
  CREATOR_PITCH_ATTACHMENT_ACCEPTED_EXTENSIONS,
  CREATOR_PITCH_ATTACHMENT_ACCEPTED_MIME_TYPES,
  MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_PX,
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

export const isPitchAttachmentWithinResolutionLimit = (width: number, height: number): boolean =>
  width <= MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_PX &&
  height <= MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_PX;

/** Returns pixel size when the browser can decode the file; otherwise null (e.g. TGA). */
export const getPitchAttachmentImageDimensions = (
  file: File,
): Promise<{ width: number; height: number } | null> => {
  if (typeof URL.createObjectURL !== 'function') {
    return Promise.resolve(null);
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const image = new Image();

    const finish = (dimensions: { width: number; height: number } | null) => {
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    image.addEventListener(
      'load',
      () => {
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
          finish(null);
          return;
        }

        finish({ width: image.naturalWidth, height: image.naturalHeight });
      },
      { once: true },
    );
    image.addEventListener(
      'error',
      () => {
        finish(null);
      },
      { once: true },
    );
    image.src = objectUrl;
  });
};

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

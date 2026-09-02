const bytesPerKB = 1024; // constants copied from creator-marketplace-web
const bytesPerMB = bytesPerKB * 1024;
const MAX_THUMBNAIL_SIZE_MB = 20;
const ACCEPTED_THUMBNAIL_FORMATS = ['jpg', 'jpeg', 'png'];
const ACCEPTED_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const MAX_THUMBNAIL_RESOLUTION = [8000, 8000]; // Maximum pixel dimensions

export interface ThumbnailValidationError {
  type: 'fileSize' | 'fileType' | 'mimeType' | 'resolution' | 'processing';
  message: string;
}

/**
 * Validates a thumbnail image file for IP listing uploads.
 * Returns null if valid, or a validation error if invalid.
 *
 * Requirements:
 * - Maximum file size: 20 MB
 * - File types: *.jpg, *.png
 * - Maximum pixel dimensions: 8000x8000
 */
export const validateIpListingThumbnail = async (
  file: File,
): Promise<ThumbnailValidationError | null> => {
  // Validate file size
  if (file.size > MAX_THUMBNAIL_SIZE_MB * bytesPerMB) {
    return {
      type: 'fileSize',
      message: `Error.ImageFileSizeTooBig`,
    };
  }

  // Validate file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ACCEPTED_THUMBNAIL_FORMATS.includes(fileExtension)) {
    return {
      type: 'fileType',
      message: `Error.ImageFileTypeInvalid`,
    };
  }

  // Validate MIME type
  if (!ACCEPTED_THUMBNAIL_MIME_TYPES.includes(file.type)) {
    return {
      type: 'mimeType',
      message: 'Error.ImageFileFormatInvalid',
    };
  }

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  const result = await new Promise<ThumbnailValidationError | null>((resolve) => {
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;

      // Validate resolution
      if (width > MAX_THUMBNAIL_RESOLUTION[0] || height > MAX_THUMBNAIL_RESOLUTION[1]) {
        resolve({
          type: 'resolution',
          message: 'Error.ImageResolutionTooLarge',
        });
      } else {
        // Image passes all validation
        resolve(null);
      }
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      resolve({
        type: 'processing',
        message: 'Error.ImageFailedToProcess',
      });
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });

  return result;
};

import {
  MAX_IP_CONTENT_IMAGE_ASPECT_RATIO,
  MIN_IP_CONTENT_IMAGE_ASPECT_RATIO,
  MAX_IP_CONTENT_IMAGE_SIZE_MB,
  MIN_IP_CONTENT_IMAGE_RESOLUTION,
} from '../constants';

const MAX_IP_CONTENT_IMAGE_SIZE_BYTES = MAX_IP_CONTENT_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates a single image file used as an IP content. Returns null if valid, or an error message if valid.
 *
 * Passed in translate function must be in the CreatorDashboard.RightsPortal namespace.
 */
const validateIpContentImage = async (
  imageFile: File,
  translate: (key: string, args?: { [key: string]: string }) => string,
  locale: string,
): Promise<string | null> => {
  // Validate image size synchronously
  if (imageFile.size > MAX_IP_CONTENT_IMAGE_SIZE_BYTES) {
    const maxIpContentImageSizeLocalized = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(MAX_IP_CONTENT_IMAGE_SIZE_MB);
    return translate('Error.IpContentImageTooLarge2', { maxSize: maxIpContentImageSizeLocalized });
  }

  // Validate image dimensions and aspect ratio asynchronously
  const img = new Image();
  const objectUrl = URL.createObjectURL(imageFile);

  const result = await new Promise<string | null>((resolve) => {
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      const aspectRatio = width / height;

      if (
        width < MIN_IP_CONTENT_IMAGE_RESOLUTION[0] ||
        height < MIN_IP_CONTENT_IMAGE_RESOLUTION[1]
      ) {
        resolve(translate('Error.IpContentImageResolutionWrong'));
      } else if (
        aspectRatio < MIN_IP_CONTENT_IMAGE_ASPECT_RATIO ||
        aspectRatio > MAX_IP_CONTENT_IMAGE_ASPECT_RATIO
      ) {
        resolve(translate('Error.IpContentImageAspectRatioWrong'));
      } else {
        // All checks passed
        resolve(null);
      }
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      resolve(translate('Error.IpContentImageCannotProcess'));
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });

  return result;
};

export default validateIpContentImage;

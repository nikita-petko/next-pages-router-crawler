import type { AssetType } from '@rbx/client-assets-upload-api/v1';
import publishClient from '@modules/clients/publish';
import { bytesPerMB } from '@modules/miscellaneous/components/uploaders/constants/size';
import FileRejectStatus from '@modules/miscellaneous/components/uploaders/enums/FileRejectStatus';

// Video validation constants
export const ACCEPTED_VIDEO_TYPES = ['mp4', 'mov'];
export const MAX_DURATION_SECONDS = 60;
export const DURATION_TOLERANCE_SECONDS = 0.1;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_RESOLUTION = { width: 4096, height: 2160 };
export const REQUIRED_ASPECT_RATIO = 16 / 9;
export const RECOMMENDED_BITRATE_MBPS = 15;

// MIME type mapping for video files
export const VIDEO_MIME_TYPES: Record<string, string[]> = {
  mp4: ['video/mp4'],
  mov: ['video/quicktime'],
};

/**
 * Get accepted MIME types for video files
 */
export const getAcceptedVideoMimeTypes = (): string[] => {
  return ACCEPTED_VIDEO_TYPES.reduce<string[]>((prev, type) => {
    if (type in VIDEO_MIME_TYPES) {
      VIDEO_MIME_TYPES[type].forEach((mimeType) => prev.push(mimeType));
    }
    return prev;
  }, []);
};

/**
 * Get video metadata (duration, width, height) from a file
 */
export const getVideoMetadata = (
  file: File,
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      window.URL.revokeObjectURL(video.src);
      resolve(metadata);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = window.URL.createObjectURL(file);
  });
};

/**
 * Validate video file for basic constraints (size, type, MIME type)
 */
export const validateVideoFile = (file: File, customMaxFileSizeMB?: number): FileRejectStatus[] => {
  const errors: FileRejectStatus[] = [];
  const acceptMimeTypes = getAcceptedVideoMimeTypes();

  // Check file size
  const maxFileSizeMB = customMaxFileSizeMB ?? MAX_FILE_SIZE_MB;
  if (file.size > maxFileSizeMB * bytesPerMB) {
    errors.push(FileRejectStatus.FileTooBig);
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ACCEPTED_VIDEO_TYPES.includes(fileExtension)) {
    errors.push(FileRejectStatus.FileWrongType);
  }

  // Check MIME type
  if (!acceptMimeTypes.includes(file.type)) {
    errors.push(FileRejectStatus.FileWrongType);
  }

  return errors;
};

/**
 * Video quota response type
 */
export interface VideoQuotaInfo {
  quotaMessage: string;
  hasCapacity: boolean;
}

/**
 * Fetch video upload quota information
 */
export const getVideoQuota = async (
  translate: (key: string, params?: Record<string, string>) => string,
  videoType: AssetType,
): Promise<VideoQuotaInfo> => {
  try {
    const response = await publishClient.getAssetQuotas('RateLimitUpload', videoType);

    const quota = response.quotas?.[0];
    let quotaMessage = '';
    let hasCapacity = true;

    if (
      quota &&
      typeof quota.usage !== 'undefined' &&
      typeof quota.capacity !== 'undefined' &&
      typeof quota.duration !== 'undefined'
    ) {
      if (quota.capacity === 0) {
        quotaMessage = translate('Message.AssetUploadNoCapacity', {
          assetType: translate('Label.Video'),
        });
        hasCapacity = false;
      } else if (quota.usage === 0) {
        quotaMessage =
          quota.duration === 'Month'
            ? translate('Message.UploadQuotaCapacityMonth', {
                assetType: translate('Label.Video'),
                capacity: quota.capacity.toString(),
                duration: translate('Label.Month'),
              })
            : translate('Message.AssetLimitInfo', { assetType: translate('Label.Video') });
      } else if (quota.expirationTime !== undefined) {
        const expiryDate = new Date(quota.expirationTime);
        const expiry = expiryDate.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        const remainingQuota = quota.capacity - quota.usage;

        if (remainingQuota <= 0) {
          hasCapacity = false;
        }

        quotaMessage =
          remainingQuota > 0
            ? translate('Message.UploadQuotaInfo', {
                assetType: translate('Label.Video'),
                usage: remainingQuota.toString(),
                capacity: quota.capacity.toString(),
                expiry,
              })
            : translate('Message.UploadQuotaReachedInfo', {
                assetType: translate('Label.Video'),
                quota: remainingQuota.toString(),
                capacity: quota.capacity.toString(),
                expiry,
              });
      }
    } else {
      quotaMessage = translate('Message.AssetLimitInfo', { assetType: translate('Label.Video') });
    }

    return { quotaMessage, hasCapacity };
  } catch {
    return {
      quotaMessage: translate('Message.AssetLimitInfo', { assetType: translate('Label.Video') }),
      hasCapacity: true, // Assume capacity if we can't determine
    };
  }
};

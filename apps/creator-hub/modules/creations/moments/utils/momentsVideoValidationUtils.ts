import {
  MOMENTS_MAX_VIDEO_DURATION_SECONDS,
  MOMENTS_MAX_VIDEO_DURATION_TOLERANCE_SECONDS,
  MOMENTS_MAX_VIDEO_RESOLUTION,
  MOMENTS_VIDEO_ACCEPTED_EXTENSIONS,
  MOMENTS_VIDEO_ACCEPTED_MIME_TYPES,
  MOMENTS_VIDEO_MAX_FILE_SIZE_BYTES,
} from '../constants/momentsUploadConstants';

export enum MomentsVideoRejectReason {
  FileTooBig = 'FileTooBig',
  FileWrongType = 'FileWrongType',
  DurationExceeded = 'DurationExceeded',
  ResolutionExceeded = 'ResolutionExceeded',
  MetadataUnavailable = 'MetadataUnavailable',
}

export type MomentsVideoValidationError = {
  file: File;
  reason: MomentsVideoRejectReason;
};

export type MomentsVideoMetadata = {
  duration: number;
  width: number;
  height: number;
};

const getFileExtension = (fileName: string): string | undefined =>
  fileName.split('.').pop()?.toLowerCase();

const isAcceptedMomentsVideoExtension = (extension: string | undefined): boolean =>
  extension != null && MOMENTS_VIDEO_ACCEPTED_EXTENSIONS.some((ext) => ext === extension);

const isAcceptedMomentsVideoType = (file: File): boolean => {
  const extension = getFileExtension(file.name);
  if (!isAcceptedMomentsVideoExtension(extension)) {
    return false;
  }

  if (file.type === '') {
    return true;
  }

  return MOMENTS_VIDEO_ACCEPTED_MIME_TYPES.includes(file.type);
};

/** Validates synchronous constraints (size and file type) for a Moments video file. */
export const validateMomentsVideoFileSync = (file: File): MomentsVideoRejectReason | null => {
  if (file.size > MOMENTS_VIDEO_MAX_FILE_SIZE_BYTES) {
    return MomentsVideoRejectReason.FileTooBig;
  }

  if (!isAcceptedMomentsVideoType(file)) {
    return MomentsVideoRejectReason.FileWrongType;
  }

  return null;
};

/** Reads duration and resolution metadata from a local video file. */
export const getMomentsVideoMetadata = (file: File): Promise<MomentsVideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);

    video.addEventListener(
      'loadedmetadata',
      () => {
        URL.revokeObjectURL(objectUrl);

        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error('Video duration is unavailable'));
          return;
        }

        resolve({
          duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      },
      { once: true },
    );

    video.addEventListener(
      'error',
      () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load video metadata'));
      },
      { once: true },
    );

    video.src = objectUrl;
  });
};

const validateMomentsVideoMetadataValues = ({
  duration,
  width,
  height,
}: MomentsVideoMetadata): MomentsVideoRejectReason | null => {
  if (
    duration >
    MOMENTS_MAX_VIDEO_DURATION_SECONDS + MOMENTS_MAX_VIDEO_DURATION_TOLERANCE_SECONDS
  ) {
    return MomentsVideoRejectReason.DurationExceeded;
  }

  if (width > MOMENTS_MAX_VIDEO_RESOLUTION.width || height > MOMENTS_MAX_VIDEO_RESOLUTION.height) {
    return MomentsVideoRejectReason.ResolutionExceeded;
  }

  return null;
};

/** Validates asynchronous constraints (duration and resolution) for a Moments video file. */
export const validateMomentsVideoMetadata = async (
  file: File,
): Promise<MomentsVideoRejectReason | null> => {
  try {
    const metadata = await getMomentsVideoMetadata(file);
    return validateMomentsVideoMetadataValues(metadata);
  } catch {
    return MomentsVideoRejectReason.MetadataUnavailable;
  }
};

/** Filters a file list to valid Moments videos and returns per-file rejection reasons. */
export const filterValidMomentsVideoFiles = async (
  files: File[],
): Promise<{ validFiles: File[]; errors: MomentsVideoValidationError[] }> => {
  const validFiles: File[] = [];
  const errors: MomentsVideoValidationError[] = [];

  for (const file of files) {
    const syncError = validateMomentsVideoFileSync(file);
    if (syncError != null) {
      errors.push({ file, reason: syncError });
      continue;
    }

    const metadataError = await validateMomentsVideoMetadata(file);
    if (metadataError != null) {
      errors.push({ file, reason: metadataError });
      continue;
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
};

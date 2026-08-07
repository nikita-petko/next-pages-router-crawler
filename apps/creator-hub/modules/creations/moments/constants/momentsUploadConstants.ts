/** Accept attribute for the Moments video upload drop zone. */
export const MOMENTS_VIDEO_ACCEPT = 'video/mp4,video/quicktime,.mp4,.mov';

/** Accepted file extensions for Moments video uploads. */
export const MOMENTS_VIDEO_ACCEPTED_EXTENSIONS = ['mp4', 'mov'] as const;

/** Accepted MIME types for Moments video uploads (also validated on drag-and-drop). */
export const MOMENTS_VIDEO_ACCEPTED_MIME_TYPES = ['video/mp4', 'video/quicktime'];

/** Maximum video duration in seconds (5 minutes). */
export const MOMENTS_MAX_VIDEO_DURATION_SECONDS = 300;

/** Small tolerance for duration checks to account for floating-point metadata. */
export const MOMENTS_MAX_VIDEO_DURATION_TOLERANCE_SECONDS = 0.1;

/** Maximum video width and height in pixels. */
export const MOMENTS_MAX_VIDEO_RESOLUTION = { width: 4096, height: 2160 };

/** Maximum file size per video in gigabytes. */
export const MOMENTS_MAX_VIDEO_FILE_SIZE_GB = 3.75;

export const MOMENTS_VIDEO_MAX_FILE_SIZE_BYTES =
  MOMENTS_MAX_VIDEO_FILE_SIZE_GB * 1024 * 1024 * 1024;

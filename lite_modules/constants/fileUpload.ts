export const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
export const IMAGE_UPLOAD_INTERVAL = 750;
export const MAX_IMAGE_UPLOAD_RETRIES = 20;
export const ONE_HUNDRED_MB_IN_BYTES = 100000000;
export const MAX_CHUNKING_SIZE = 10 * 1000 * 1000; // 10MB in bytes
export const VIDEO_DURATION_MAX_IN_SECONDS = 300;
export const MAX_VIDEO_UPLOAD_RETRIES = 200; // 5 minutes (200 retries * 1.5s interval)

export const VALID_VIDEO_MIME_TYPES: { [id: string]: boolean } = {
  'video/3g2': true,
  'video/3gp': true,
  'video/3gp2': true,
  'video/3gpp': true,
  'video/asf': true,
  'video/asx': true,
  'video/avi': true,
  'video/divx': true,
  'video/m4v': true,
  // These are all the formats that are covered under the `mov` format
  'video/mov': true,
  'video/mp4': true,
  'video/mpe': true,
  'video/mpeg': true,
  'video/mpg': true,
  'video/ogg': true,
  'video/quicktime': true,
  'video/wmv': true,
  'video/x-m4v': true,
};

export const VIDEO_ACCEPT_FORMATS =
  'video/mov, video/3g2, video/3gp, video/3gp2, video/3gpp, video/asf, video/asx, video/avi, video/divx, video/m4v, video/mp4, video/mpe, video/x-m4v, video/mpeg, video/mpg, video/ogg, video/wmv, video/quicktime';

export const IMAGE_ACCEPT_FORMATS = 'image/png, image/jpeg';

export const FALLBACK_ASPECT_RATIO = '9:16';

export const FALLBACK_VIDEO_FILE_NAME = 'Video file';

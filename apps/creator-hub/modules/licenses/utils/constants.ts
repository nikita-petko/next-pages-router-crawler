/** Fixed action-toolbar row height (px) for explore licenses grid/list — keeps layout stable when switching views. */
export const EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX = 65;
export const EXPLORE_LICENSES_ACTION_GAP_PX = 20;

export const GROUP_OWNER_ROLESET_RANK = 255;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Earliest calendar day allowed as the license start date (whole days after local midnight today). */
export const MIN_LICENSE_START_DATE_LEAD_DAYS = 10;

/** Maximum months into the future users can select in the license date range picker. */
export const MAX_DATE_SELECTOR_LOOKAHEAD_MONTHS = 12;

export const MIN_CREATOR_PITCH_LENGTH = 100;
export const MAX_CREATOR_PITCH_LENGTH = 1000;

/** Max supporting files a creator can attach when describing license intent. */
export const MAX_CREATOR_PITCH_ATTACHMENT_COUNT = 10;

/** Max size per pitch attachment image (20 MB). */
export const MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;

export const CREATOR_PITCH_ATTACHMENT_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/tga,image/bmp,.png,.jpg,.jpeg,.tga,.bmp';

export const CREATOR_PITCH_ATTACHMENT_ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/tga',
  'image/x-tga',
  'image/targa',
  'image/x-targa',
  'image/bmp',
  'image/x-ms-bmp',
]);

export const CREATOR_PITCH_ATTACHMENT_ACCEPTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.tga',
  '.bmp',
]);

export enum CreatorPitchAttachmentStatus {
  Uploading = 'uploading',
  Ready = 'ready',
  PendingModeration = 'pendingModeration',
  Error = 'error',
}

export enum CreatorPitchAttachmentErrorType {
  UploadFailed = 'uploadFailed',
  FileTooLarge = 'fileTooLarge',
  Moderated = 'moderated',
}

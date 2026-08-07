import {
  MOMENTS_MAX_VIDEO_DURATION_SECONDS,
  MOMENTS_MAX_VIDEO_FILE_SIZE_GB,
  MOMENTS_MAX_VIDEO_RESOLUTION,
  MOMENTS_VIDEO_ACCEPTED_EXTENSIONS,
} from '../constants/momentsUploadConstants';
import { MomentsVideoRejectReason } from './momentsVideoValidationUtils';

type TranslateFn = (key: string, params?: Record<string, string>) => string;

const ACCEPTED_FORMATS_DISPLAY = MOMENTS_VIDEO_ACCEPTED_EXTENSIONS.map((ext) =>
  ext.toUpperCase(),
).join('/');

/** Maps a Moments video reject reason to a user-facing translated message. */
export const translateMomentsVideoRejectReason = (
  translate: TranslateFn,
  reason: MomentsVideoRejectReason,
): string => {
  switch (reason) {
    case MomentsVideoRejectReason.FileTooBig:
      return translate('CreateMomentModal.Error.FileTooBig', {
        maxFileSizeGB: String(MOMENTS_MAX_VIDEO_FILE_SIZE_GB),
      });
    case MomentsVideoRejectReason.FileWrongType:
      return translate('CreateMomentModal.Error.FileWrongType', {
        formats: ACCEPTED_FORMATS_DISPLAY,
      });
    case MomentsVideoRejectReason.DurationExceeded:
      return translate('CreateMomentModal.Error.DurationExceeded', {
        maxDurationMinutes: String(MOMENTS_MAX_VIDEO_DURATION_SECONDS / 60),
      });
    case MomentsVideoRejectReason.ResolutionExceeded:
      return translate('CreateMomentModal.Error.ResolutionExceeded', {
        maxWidth: String(MOMENTS_MAX_VIDEO_RESOLUTION.width),
        maxHeight: String(MOMENTS_MAX_VIDEO_RESOLUTION.height),
      });
    case MomentsVideoRejectReason.MetadataUnavailable:
      return translate('CreateMomentModal.Error.MetadataUnavailable');
    default: {
      const exhaustiveCheck: never = reason;
      throw new Error(`Unhandled Moments video reject reason: ${String(exhaustiveCheck)}`);
    }
  }
};

/** Builds unique translated messages for a set of Moments video validation errors. */
export const getMomentsVideoValidationErrorMessages = (
  translate: TranslateFn,
  reasons: readonly MomentsVideoRejectReason[],
): string[] => {
  const uniqueReasons = [...new Set(reasons)];
  return uniqueReasons.map((reason) => translateMomentsVideoRejectReason(translate, reason));
};

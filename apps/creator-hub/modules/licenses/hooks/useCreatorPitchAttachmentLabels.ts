import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CreatorPitchAttachmentErrorType,
  MAX_CREATOR_PITCH_ATTACHMENT_COUNT,
  MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES,
} from '../utils/constants';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';

const MAX_CREATOR_PITCH_ATTACHMENT_COUNT_LOCALIZED = new Intl.NumberFormat(undefined).format(
  MAX_CREATOR_PITCH_ATTACHMENT_COUNT,
);

const MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED = new Intl.NumberFormat(undefined).format(
  MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES / (1024 * 1024),
);

const useCreatorPitchAttachmentLabels = () => {
  const translation = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(translation);

  const deleteAriaLabel = translation.translate('Action.Delete');

  const descriptionText = tPendingTranslation(
    'Add images, sketches, or mockups to help rights holders see your vision and get inspired to collaborate.',
    'Helper text above the upload control on the license intent step.',
    translationKey('Description.PitchAttachments', TranslationNamespace.Licenses),
  );

  const uploadButtonLabel = tPendingTranslation(
    'Upload Images',
    'Button label to attach images or documents to a license request pitch.',
    translationKey('Action.UploadImages', TranslationNamespace.Licenses),
  );

  const limitsText = tPendingTranslation(
    'Up to {maxCount} files · Images (PNG, JPG, TGA, BMP) · Max {maxSize} MB each.',
    'Accepted file types, max count, and max file size under the pitch attachment upload button; {maxCount} and {maxSize} are localized.',
    translationKey('Description.PitchAttachmentLimits', TranslationNamespace.Licenses),
    {
      maxCount: MAX_CREATOR_PITCH_ATTACHMENT_COUNT_LOCALIZED,
      maxSize: MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED,
    },
  );

  const previewAlt = tPendingTranslation(
    'Attachment preview',
    'Alt text for a pitch attachment image thumbnail.',
    translationKey('Label.PitchAttachmentPreview', TranslationNamespace.Licenses),
  );

  const uploadingLabel = tPendingTranslation(
    'Uploading image',
    'Accessible label for the loading indicator while a pitch attachment image uploads.',
    translationKey('Label.UploadingPitchAttachment', TranslationNamespace.Licenses),
  );

  const uploadFailedText = tPendingTranslation(
    'Upload failed. Remove and try again.',
    'Error shown when a pitch attachment image fails to upload.',
    translationKey('Error.PitchAttachmentUploadFailed', TranslationNamespace.Licenses),
  );

  const moderatedText = tPendingTranslation(
    'This image violates our community guidelines. Delete and upload another one.',
    'Error shown when a pitch attachment image is rejected by moderation.',
    translationKey('Error.PitchAttachmentModerated', TranslationNamespace.Licenses),
  );

  const pendingModerationLabel = tPendingTranslation(
    'Moderation pending',
    'Accessible label for a pitch attachment preview while image moderation is still in progress.',
    translationKey('Label.PitchAttachmentModerationPending', TranslationNamespace.Licenses),
  );

  const fileTooLargeText = tPendingTranslation(
    'File must be {maxSize} MB or smaller. Remove and try again.',
    'Error shown when a pitch attachment exceeds the max file size; {maxSize} is localized.',
    translationKey('Error.PitchAttachmentFileTooLarge', TranslationNamespace.Licenses),
    { maxSize: MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED },
  );

  const getAttachmentErrorText = useCallback(
    (attachment: CreatorPitchAttachment): string => {
      if (attachment.errorType === CreatorPitchAttachmentErrorType.Moderated) {
        return moderatedText;
      }
      if (attachment.errorType === CreatorPitchAttachmentErrorType.FileTooLarge) {
        return fileTooLargeText;
      }
      return uploadFailedText;
    },
    [fileTooLargeText, moderatedText, uploadFailedText],
  );

  return {
    deleteAriaLabel,
    descriptionText,
    getAttachmentErrorText,
    limitsText,
    pendingModerationLabel,
    previewAlt,
    uploadButtonLabel,
    uploadingLabel,
  };
};

export default useCreatorPitchAttachmentLabels;

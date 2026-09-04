import { useCallback } from 'react';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CreatorPitchAttachmentErrorType,
  MAX_CREATOR_PITCH_ATTACHMENT_COUNT,
  MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_PX,
  MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES,
} from '../utils/constants';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';

const MAX_CREATOR_PITCH_ATTACHMENT_COUNT_LOCALIZED = new Intl.NumberFormat(undefined).format(
  MAX_CREATOR_PITCH_ATTACHMENT_COUNT,
);

const MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED = new Intl.NumberFormat(undefined).format(
  MAX_CREATOR_PITCH_ATTACHMENT_SIZE_BYTES / (1024 * 1024),
);

const MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_LOCALIZED = new Intl.NumberFormat(undefined).format(
  MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_PX,
);

const useCreatorPitchAttachmentLabels = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { translate: translateAgreements } = useTranslationWithNamespace(
    TranslationNamespace.AgreementsManager,
  );

  const deleteAriaLabel = translate('Action.DeleteAttachment');

  const descriptionText = tPendingTranslation(
    'Add images, such as sketches, references, or mockups.',
    'Helper text above the upload control on the license intent step.',
    translationKey('Description.PitchAttachments', TranslationNamespace.Licenses),
  );

  const uploadButtonLabel = tPendingTranslation(
    'Upload images',
    'Button label to attach images or documents to a license request pitch.',
    translationKey('Action.UploadImages', TranslationNamespace.Licenses),
  );

  const limitsText = translate('Description.PitchAttachmentLimits', {
    maxCount: MAX_CREATOR_PITCH_ATTACHMENT_COUNT_LOCALIZED,
    maxSize: MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED,
    maxWidth: MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_LOCALIZED,
    maxHeight: MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_LOCALIZED,
  });

  const previewAlt = translate('Label.PitchAttachmentPreview');

  const uploadingLabel = translate('Label.UploadingPitchAttachment');

  const uploadFailedText = translate('Error.PitchAttachmentUploadFailed');

  const moderatedText = translate('Error.PitchAttachmentModerated');

  const pendingModerationLabel = translate('Label.PitchAttachmentModerationPending');

  const fileTooLargeText = translate('Error.PitchAttachmentFileTooLarge', {
    maxSize: MAX_CREATOR_PITCH_ATTACHMENT_SIZE_MB_LOCALIZED,
  });

  const resolutionTooLargeText = translate('Error.PitchAttachmentResolutionTooLarge', {
    maxWidth: MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_LOCALIZED,
    maxHeight: MAX_CREATOR_PITCH_ATTACHMENT_DIMENSION_LOCALIZED,
  });

  const requiredErrorText = translateAgreements('Label.FieldIsRequired');

  const getAttachmentErrorText = useCallback(
    (attachment: CreatorPitchAttachment): string => {
      if (attachment.errorType === CreatorPitchAttachmentErrorType.Moderated) {
        return moderatedText;
      }
      if (attachment.errorType === CreatorPitchAttachmentErrorType.FileTooLarge) {
        return fileTooLargeText;
      }
      if (attachment.errorType === CreatorPitchAttachmentErrorType.ResolutionTooLarge) {
        return resolutionTooLargeText;
      }
      return uploadFailedText;
    },
    [fileTooLargeText, moderatedText, resolutionTooLargeText, uploadFailedText],
  );

  return {
    deleteAriaLabel,
    descriptionText,
    getAttachmentErrorText,
    limitsText,
    pendingModerationLabel,
    previewAlt,
    requiredErrorText,
    uploadButtonLabel,
    uploadingLabel,
  };
};

export default useCreatorPitchAttachmentLabels;

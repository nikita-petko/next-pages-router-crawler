import type { FC } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Dialog, DialogBody, DialogContent, DialogTitle, FeedbackBanner } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { openDialog } from '@modules/monetization-shared/dialog/actions';
import { useMomentsLocalMoments } from '../hooks/useMomentsLocalMoments';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
import useMomentsUploadLanguageSelectEnabled from '../hooks/useMomentsUploadLanguageSelectEnabled';
import { useMomentsVideoUpload } from '../hooks/useMomentsVideoUpload';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import type { DraftMomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import { getDefaultMomentsUploadLocale } from '../utils/momentsUploadLocaleUtils';
import MomentsExperiencePreview from './MomentsExperiencePreview';
import MomentsExperienceUrlInput from './MomentsExperienceUrlInput';
import MomentsLanguageSelect from './MomentsLanguageSelect';
import MomentsVideoUploadZone from './MomentsVideoUploadZone';

type CreateMomentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMomentUploaded?: (moment: DraftMomentCreation) => void;
};

const CreateMomentsDialog: FC<CreateMomentsDialogProps> = ({
  open,
  onOpenChange,
  onMomentUploaded,
}) => {
  const { addMoments } = useMomentsLocalMoments();
  const { setStatusTab } = useMomentsStatusFilter();
  const isLanguageSelectEnabled = useMomentsUploadLanguageSelectEnabled();
  const { translate } = useTranslation();
  const { locale: uiLocale } = useLocalization();
  const defaultLocale = getDefaultMomentsUploadLocale(uiLocale);
  const [selectedExperience, setSelectedExperience] = useState<TExperience | undefined>();
  const [localeOverride, setLocaleOverride] = useState<Locale | undefined>();
  const selectedLocale = localeOverride ?? defaultLocale;
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);
  const [validationErrorMessages, setValidationErrorMessages] = useState<string[]>([]);
  const uploadSessionRef = useRef(0);
  const { uploadVideos, isUploading } = useMomentsVideoUpload();

  const resetForm = useCallback(() => {
    setSelectedExperience(undefined);
    setLocaleOverride(undefined);
    setSelectedVideoFiles([]);
    setValidationErrorMessages([]);
  }, []);

  const closeDialog = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const handleExperienceResolved = useCallback((experience: TExperience) => {
    setSelectedExperience(experience);
  }, []);

  const handleLocaleChange = useCallback((locale: Locale) => {
    setLocaleOverride(locale);
  }, []);

  const handleChangeExperience = useCallback(() => {
    uploadSessionRef.current += 1;
    setSelectedVideoFiles([]);
    setValidationErrorMessages([]);
    setSelectedExperience(undefined);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isUploading) {
        return;
      }

      onOpenChange(isOpen);
      if (!isOpen) {
        resetForm();
      }
    },
    [isUploading, onOpenChange, resetForm],
  );

  const handleValidationErrorsChange = useCallback((messages: string[]) => {
    setValidationErrorMessages(messages);
  }, []);

  const handleDismissValidationErrors = useCallback(() => {
    setValidationErrorMessages([]);
  }, []);

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      if (
        files.length === 0 ||
        selectedExperience?.id == null ||
        (isLanguageSelectEnabled && selectedLocale == null) ||
        isUploading
      ) {
        setSelectedVideoFiles(files);
        return;
      }

      const uploadSession = uploadSessionRef.current + 1;
      uploadSessionRef.current = uploadSession;
      setSelectedVideoFiles(files);

      logMomentsCreationsAttempt(MomentsCreationsOperation.UploadVideo, {
        experienceId: selectedExperience.id,
        fileCount: files.length,
        fileSize: files.reduce((total, file) => total + file.size, 0),
        fileType: files[0]?.type,
        ...(isLanguageSelectEnabled ? { locale: selectedLocale } : {}),
      });

      try {
        const { moments: uploadedMoments, storageEvictedMediaDraftIds } = await uploadVideos({
          experience: selectedExperience,
          files,
          ...(isLanguageSelectEnabled ? { locale: selectedLocale } : {}),
        });
        if (uploadSessionRef.current !== uploadSession) {
          return;
        }

        if (onMomentUploaded) {
          uploadedMoments.forEach((moment) => {
            onMomentUploaded(moment);
          });
        } else {
          addMoments(uploadedMoments, { storageEvictedMediaDraftIds });
        }
        logMomentsCreationsSuccess(MomentsCreationsOperation.UploadVideo, {
          experienceId: selectedExperience.id,
          fileCount: uploadedMoments.length,
          persistedVideoCount: uploadedMoments.filter((moment) => moment.hasLocalVideo).length,
          fileSize: files.reduce((total, file) => total + file.size, 0),
          fileType: files[0]?.type,
          ...(isLanguageSelectEnabled ? { locale: selectedLocale } : {}),
        });
        setStatusTab(MomentCreationStatus.DRAFT);
        closeDialog();
      } catch (uploadError) {
        if (uploadSessionRef.current !== uploadSession) {
          return;
        }

        logMomentsCreationsError(MomentsCreationsErrorOperation.UploadVideo, uploadError, {
          experienceId: selectedExperience.id,
          fileCount: files.length,
          fileSize: files.reduce((total, file) => total + file.size, 0),
          fileType: files[0]?.type,
          ...(isLanguageSelectEnabled ? { locale: selectedLocale } : {}),
        });
        setSelectedVideoFiles([]);
      }
    },
    [
      addMoments,
      closeDialog,
      isLanguageSelectEnabled,
      isUploading,
      onMomentUploaded,
      selectedExperience,
      selectedLocale,
      setStatusTab,
      uploadVideos,
    ],
  );

  const createMomentTitle = translate('CreateMomentModal.Title');
  const primaryValidationError = validationErrorMessages[0];
  const additionalValidationErrors =
    validationErrorMessages.length > 1 ? validationErrorMessages.slice(1).join(' ') : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent className='flex flex-col min-width-0 width-[min(720px,95vw)] !max-width-[min(720px,95vw)]'>
        <DialogBody className='flex flex-col gap-y-medium'>
          <DialogTitle className='text-heading-small content-emphasis margin-none'>
            {createMomentTitle}
          </DialogTitle>

          {primaryValidationError != null ? (
            <div className='width-full margin-top-small padding-bottom-small'>
              {/* oxlint-disable-next-line typescript/no-deprecated -- SHARE-2999 to migrate to Alert */}
              <FeedbackBanner
                className='width-full'
                layout='Stacked'
                variant='Standard'
                severity='Error'
                title={primaryValidationError}
                description={additionalValidationErrors}
                onDismiss={handleDismissValidationErrors}
                dismissIconAriaLabel={translate('Action.Close')}
                data-testid='moments-video-validation-error-banner'
              />
            </div>
          ) : null}

          {selectedExperience ? (
            <MomentsExperiencePreview
              experience={selectedExperience}
              onChangeExperience={handleChangeExperience}
            />
          ) : (
            <MomentsExperienceUrlInput
              onExperienceResolved={handleExperienceResolved}
              isDisabled={isUploading}
            />
          )}

          {isLanguageSelectEnabled ? (
            <MomentsLanguageSelect
              value={selectedLocale}
              onChange={handleLocaleChange}
              isDisabled={isUploading}
            />
          ) : null}

          <MomentsVideoUploadZone
            hasSelectedExperience={selectedExperience?.id != null}
            hasSelectedLanguage={!isLanguageSelectEnabled || selectedLocale != null}
            selectedFiles={selectedVideoFiles}
            isUploading={isUploading}
            onFilesChange={handleFilesChange}
            onValidationErrorsChange={handleValidationErrorsChange}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const TranslatedCreateMomentsDialog = withTranslation(CreateMomentsDialog, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);

export default TranslatedCreateMomentsDialog;

export function openCreateMomentsDialog(
  params: Omit<CreateMomentsDialogProps, 'open' | 'onOpenChange'> = {},
) {
  openDialog({
    component: TranslatedCreateMomentsDialog,
    props: params,
    options: { mode: 'standalone' },
  });
}

import type { FC } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Dialog, DialogBody, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { openDialog } from '@modules/monetization-shared/dialog/actions';
import { useMomentsLocalMoments } from '../hooks/useMomentsLocalMoments';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
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
import { MomentCreationStatus } from '../types/MomentCreation';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import MomentsExperiencePreview from './MomentsExperiencePreview';
import MomentsExperienceUrlInput from './MomentsExperienceUrlInput';
import MomentsVideoUploadZone from './MomentsVideoUploadZone';

type CreateMomentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMomentUploaded?: (moment: StoredMomentCreation) => void;
};

const CreateMomentsDialog: FC<CreateMomentsDialogProps> = ({
  open,
  onOpenChange,
  onMomentUploaded,
}) => {
  const { addMoments } = useMomentsLocalMoments();
  const { setStatusTab } = useMomentsStatusFilter();
  const { translate } = useTranslation();
  const [selectedExperience, setSelectedExperience] = useState<TExperience | undefined>();
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);
  const uploadSessionRef = useRef(0);
  const { uploadVideos, isUploading } = useMomentsVideoUpload();

  const resetForm = useCallback(() => {
    setSelectedExperience(undefined);
    setSelectedVideoFiles([]);
  }, []);

  const closeDialog = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const handleExperienceResolved = useCallback((experience: TExperience) => {
    setSelectedExperience(experience);
  }, []);

  const handleChangeExperience = useCallback(() => {
    uploadSessionRef.current += 1;
    setSelectedVideoFiles([]);
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

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || selectedExperience?.id == null || isUploading) {
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
      });

      try {
        const { moments: uploadedMoments, storageEvictedMediaMomentIds } = await uploadVideos({
          experience: selectedExperience,
          files,
        });
        if (uploadSessionRef.current !== uploadSession) {
          return;
        }

        if (onMomentUploaded) {
          uploadedMoments.forEach((moment) => {
            onMomentUploaded(moment);
          });
        } else {
          addMoments(uploadedMoments, { storageEvictedMediaMomentIds });
        }
        logMomentsCreationsSuccess(MomentsCreationsOperation.UploadVideo, {
          experienceId: selectedExperience.id,
          fileCount: uploadedMoments.length,
          persistedVideoCount: uploadedMoments.filter((moment) => moment.hasLocalVideo).length,
          fileSize: files.reduce((total, file) => total + file.size, 0),
          fileType: files[0]?.type,
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
        });
        setSelectedVideoFiles([]);
      }
    },
    [
      addMoments,
      closeDialog,
      isUploading,
      onMomentUploaded,
      selectedExperience,
      setStatusTab,
      uploadVideos,
    ],
  );

  const createMomentTitle = translate('CreateMomentModal.Title');

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

          <MomentsVideoUploadZone
            hasSelectedExperience={selectedExperience?.id != null}
            selectedFiles={selectedVideoFiles}
            isUploading={isUploading}
            onFilesChange={handleFilesChange}
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

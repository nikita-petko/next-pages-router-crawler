import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import FileUploadBase from '@modules/miscellaneous/components/FileUploadBase';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  MOMENTS_VIDEO_ACCEPT,
  MOMENTS_VIDEO_MAX_FILE_SIZE_BYTES,
} from '../constants/momentsUploadConstants';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  filterValidMomentsVideoFiles,
  type MomentsVideoValidationError,
} from '../utils/momentsVideoValidationUtils';

type MomentsVideoUploadZoneProps = {
  hasSelectedExperience: boolean;
  selectedFiles: File[];
  isUploading?: boolean;
  onFilesChange: (files: File[]) => void;
};

const logRejectedMomentsVideoFiles = (errors: MomentsVideoValidationError[]): void => {
  for (const { file, reason } of errors) {
    logMomentsCreationsError(MomentsCreationsErrorOperation.ValidateVideo, reason, {
      fileSize: file.size,
      fileType: file.type,
      reason,
    });
  }
};

const MomentsVideoUploadZone: FC<MomentsVideoUploadZoneProps> = ({
  hasSelectedExperience,
  selectedFiles,
  isUploading = false,
  onFilesChange,
}) => {
  const { translate } = useTranslation();
  const [isValidating, setIsValidating] = useState(false);

  const uploadVideosLabel = translate('CreateMomentModal.DropTarget.UploadButton');

  const addExperienceToUploadLabel = translate(
    'CreateMomentModal.DropTarget.NoExperienceAddedText',
  );

  const dragAndDropLabel = translate('CreateMomentModal.DropTarget.ExperienceAddedText');

  const [isDragActive, setIsDragActive] = useState(false);

  const helperLabel = hasSelectedExperience ? dragAndDropLabel : addExperienceToUploadLabel;

  const onFilesChangeRef = useRef(onFilesChange);

  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      setIsDragActive(false);

      if (!hasSelectedExperience || isUploading || isValidating) {
        return;
      }

      const selectedFilesList = Array.from(files ?? []);
      if (selectedFilesList.length === 0) {
        return;
      }

      setIsValidating(true);

      try {
        const { validFiles, errors } = await filterValidMomentsVideoFiles(selectedFilesList);

        if (errors.length > 0) {
          logRejectedMomentsVideoFiles(errors);
        }

        if (validFiles.length > 0) {
          onFilesChangeRef.current(validFiles);
        }
      } finally {
        setIsValidating(false);
      }
    },
    [hasSelectedExperience, isUploading, isValidating],
  );

  const handleDragActive = useCallback(() => {
    if (hasSelectedExperience && !isUploading && !isValidating) {
      setIsDragActive(true);
    }
  }, [hasSelectedExperience, isUploading, isValidating]);

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const isUploadDisabled = !hasSelectedExperience || isUploading || isValidating;

  return (
    <div className='flex flex-col gap-y-small width-full'>
      <FileUploadBase
        accept={MOMENTS_VIDEO_ACCEPT}
        multiple
        size={MOMENTS_VIDEO_MAX_FILE_SIZE_BYTES}
        onChange={handleFiles}
        onDragActiveHandler={handleDragActive}
        onDragLeaveHandler={handleDragLeave}
        className='width-full'>
        {(onClick, onKeyDown, onDrop, onDragOverOrEnter, onDragLeave) => (
          <div
            role='presentation'
            onKeyDown={onKeyDown}
            onDrop={onDrop}
            onDragOver={onDragOverOrEnter}
            onDragLeave={onDragLeave}
            className={`flex flex-col items-center justify-center gap-y-small padding-xlarge radius-medium stroke-standard width-full min-height-250 ${
              isDragActive ? 'bg-shift-200' : 'bg-surface-100'
            }`}>
            <Button
              variant='Standard'
              size='Medium'
              type='button'
              icon={isUploading || isValidating ? undefined : 'icon-regular-arrow-up-from-line'}
              isDisabled={isUploadDisabled}
              onClick={onClick}>
              {isUploading || isValidating ? (
                <span className='inline-flex items-center gap-xsmall'>
                  <ProgressCircle
                    ariaLabel={uploadVideosLabel}
                    size='Small'
                    variant='Indeterminate'
                  />
                  {uploadVideosLabel}
                </span>
              ) : (
                uploadVideosLabel
              )}
            </Button>
            <span className='text-body-small content-muted text-align-x-center'>{helperLabel}</span>
            {selectedFiles.map((file) => (
              <span
                key={`${file.name}-${file.lastModified}`}
                className='text-body-small content-muted text-align-x-center'>
                {file.name}
              </span>
            ))}
          </div>
        )}
      </FileUploadBase>
    </div>
  );
};

export default withTranslation(MomentsVideoUploadZone, [TranslationNamespace.Creations]);

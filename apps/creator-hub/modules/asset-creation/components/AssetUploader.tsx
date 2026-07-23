import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Button, FormHelperText, Typography, Link } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Asset } from '@modules/miscellaneous/common';
import { FileUploadBase } from '@modules/miscellaneous/components';
import { bytesPerMB } from '@modules/miscellaneous/components/uploaders/constants/size';
import FileRejectStatus from '@modules/miscellaneous/components/uploaders/enums/FileRejectStatus';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { assetTypeInfoTextMessage } from '../constants/AssetTypeConstants';
import {
  fileTypeToMimeTypes,
  assetTypeToMimeCategory,
  imagePreviewRequiredAssetTypes,
} from '../constants/commonConstants';
import useAssetUploaderStyles from './AssetUploader.styles';

export type FileRejections = {
  file: File;
  errors: FileRejectStatus[];
};

export type AssetUploaderProps = {
  maxFileSizeMB?: number | null;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  ariaDescribedBy?: string;
  acceptedFileTypes: string[] | undefined;
  durationLimit: number | null;
  maxResolutionLimit: string | null;
  onChange: (file: File | null) => void;
  onReject?: (rejection: FileRejections) => void;
  onRemove?: () => void;
  onReset?: () => void;
  testAssetUrl?: string;
  uploadText?: string;
  changeText?: string;
  removeText?: string;
  infoText?: string;
  assetType: Asset;
  droppedFile: File | undefined;
};

const AssetUploader: FunctionComponent<React.PropsWithChildren<AssetUploaderProps>> = (props) => {
  const [fileErrors, setFileErrors] = useState<FileRejectStatus[] | null>(null);
  const [shouldShowPreview, setShouldShowPreview] = useState<boolean>(false);
  const [newAssetUrl, setNewAssetUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const { translate, translateHTML } = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { classes: styles } = useAssetUploaderStyles();

  const {
    maxFileSizeMB,
    acceptedFileTypes,
    durationLimit,
    maxResolutionLimit,
    onChange,
    onRemove,
    onReject,
    onReset,
    testAssetUrl,
    changeText,
    removeText,
    uploadText,
    infoText,
    assetType,
    droppedFile,
  } = props;

  const acceptMimeTypes = acceptedFileTypes?.reduce<string[]>((prev, type) => {
    if (type === 'mov') {
      prev.push('video/quicktime');
    }
    if (type in fileTypeToMimeTypes) {
      fileTypeToMimeTypes[type].forEach((item) => prev.push(item));
    } else {
      prev.push(`${assetTypeToMimeCategory[assetType]}/${type}`);
    }
    return prev;
  }, []);

  const fileChangeButtonText = useMemo(() => {
    if (newAssetUrl || testAssetUrl) {
      return changeText ?? translate('Action.Change');
    }
    return uploadText ?? translate('Action.UploadSimple');
  }, [newAssetUrl, testAssetUrl, uploadText, changeText, translate]);

  const fileRemoveButtonText = useMemo(() => {
    if (newAssetUrl || testAssetUrl) {
      return removeText ?? translate('Action.Remove');
    }
    return '';
  }, [newAssetUrl, testAssetUrl, removeText, translate]);

  const fileExtensionInfoDisplay = useMemo(() => {
    if (fileErrors && fileErrors.length > 0) {
      return (
        <>
          {fileErrors.map((e) => {
            switch (e) {
              case FileRejectStatus.FileWrongType:
                return (
                  <Typography key={e} color='error'>
                    {translate('Message.WrongFormatError')}
                  </Typography>
                );
              case FileRejectStatus.FileTooBig:
                return (
                  <Typography key={e} color='error'>
                    {translate('Message.MaxSizeExceededError', {
                      maxFileSize: `${maxFileSizeMB}MB`,
                    })}
                  </Typography>
                );
              case FileRejectStatus.TooManyFiles:
              default:
                return null;
            }
          })}
        </>
      );
    }
    return `${translate('Label.Format')} ${acceptedFileTypes?.map((type) => `*.${type}`).join(', ')}`;
  }, [translate, fileErrors, acceptedFileTypes, maxFileSizeMB]);

  const assetTypeSpecificInfoSection = useMemo(() => {
    if (infoText) {
      return infoText;
    }

    // Pending key: not yet registered in Translations Hub. Use English fallback locally/sitetest.
    if (assetType === Asset.AvatarBackground) {
      return tPendingTranslation(
        'Background uploads must be exactly 2560x1440 without alpha channel.',
        'Helper text under the Avatar Background upload button stating exact dimensions and no alpha channel',
        translationKey(
          'Message.AvatarBackgroundUploadRequirements',
          TranslationNamespace.AssetUpload,
        ),
      );
    }

    const typeSpecificMessage = assetTypeInfoTextMessage[assetType];
    if (typeSpecificMessage != null) {
      return translate(typeSpecificMessage);
    }
    return null;
  }, [infoText, assetType, translate, tPendingTranslation]);

  const durationLimitText = useMemo(() => {
    if (durationLimit != null && durationLimit > 0) {
      // Convert duration to minutes if possible.
      if (durationLimit > 60 && durationLimit % 60 === 0) {
        return translate('Message.DurationLimitMinutesText', {
          maxDurationMinutes: (durationLimit / 60).toString() ?? '',
        });
      }

      return translate('Message.DurationLimitText', {
        maxDuration: durationLimit.toString() ?? '',
      });
    }
    return null;
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
  }, [durationLimit, translate]);

  const resolutionInfoText = useMemo(() => {
    return maxResolutionLimit
      ? translate('Message.MaxResolutionLimitText', {
          maxResolution: maxResolutionLimit ?? '',
        })
      : null;
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
  }, [maxResolutionLimit, translate]);

  const attachmentLimitText = useMemo(() => {
    if (!maxFileSizeMB) {
      return null;
    }

    return (
      <Typography variant='body2' style={{ whiteSpace: 'nowrap' }}>
        <span>
          {translate('Message.AttachmentSizeLimit', {
            maxAttachmentSize: maxFileSizeMB.toString(),
          })}
        </span>

        {assetType === Asset.Video && (
          <span>
            {'. '}
            {translateHTML(
              'Label.UseAssetManagerInStudio',
              [
                {
                  opening: 'aStart',
                  closing: 'aEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ui/video-frames#upload`}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ],
              { byteLimit: '3.75GB' },
            )}
          </span>
        )}
      </Typography>
    );
  }, [maxFileSizeMB, assetType, translate, translateHTML]);

  const handleRemoveFile = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
    setNewAssetUrl(null);
    setCurrentFileName(null);
    setFileErrors(null);
  }, [onRemove]);

  const handleRejectedImage = useCallback((rejection: FileRejections) => {
    setFileErrors(rejection.errors);
  }, []);

  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  const handleChange = (files: FileList | File | null) => {
    if (files !== null) {
      let file: File | null;

      if (files instanceof FileList && files.length > 0) {
        file = files.item(0);
        if (file == null) {
          return;
        }
      } else if (files instanceof File) {
        file = files;
      } else {
        return;
      }

      const rejectionStatus: FileRejectStatus[] = [];
      if (maxFileSizeMB && file.size > maxFileSizeMB * bytesPerMB) {
        rejectionStatus.push(FileRejectStatus.FileTooBig);
      }
      if (!acceptMimeTypes?.includes(file.type)) {
        rejectionStatus.push(FileRejectStatus.FileWrongType);
      }
      if (rejectionStatus.length > 0) {
        if (onReject) {
          onReject({
            file,
            errors: rejectionStatus,
          });
        }
        handleRejectedImage({
          file,
          errors: rejectionStatus,
        });
      } else {
        const url = URL.createObjectURL(file);
        setNewAssetUrl(url);
        setCurrentFileName(file.name);
        onChange(file);
        setFileErrors(null);
      }
    } else {
      setNewAssetUrl(null);
      setCurrentFileName(null);
      setFileErrors(null);
    }
  };

  const isAvatarBackground = assetType === Asset.AvatarBackground;
  const placeholderAspectClass = isAvatarBackground ? 'aspect-16-9' : 'aspect-1-1';
  // Fixed footprint per aspect ratio, capped so it shrinks gracefully on narrow
  // viewports. Height derives from the width via the aspect class
  // (16:9 -> 240x135, 1:1 -> 150x150).
  const previewSizeClass = isAvatarBackground
    ? '[width:240px] [max-width:100%]'
    : '[width:150px] [max-width:100%]';

  const imageContent = newAssetUrl ? (
    <div
      data-testid='asset-preview-tile'
      className={`${placeholderAspectClass} ${previewSizeClass} radius-medium clip bg-surface-100`}>
      <img
        src={newAssetUrl}
        alt={tPendingTranslation(
          'Preview',
          'Alt text for the uploaded asset image preview, read by screen readers',
          translationKey('Label.Preview', TranslationNamespace.AssetUpload),
        )}
        className='width-full height-full [object-fit:contain] block'
      />
    </div>
  ) : (
    <FileUploadBase
      className='width-full'
      accept={acceptedFileTypes?.map((type) => `.${type}`).join(',') ?? ''}
      size={maxFileSizeMB ? maxFileSizeMB * bytesPerMB : undefined}
      onChange={handleChange}>
      {(onClick) => (
        <button
          type='button'
          data-testid='asset-upload-tile'
          aria-label={uploadText ?? translate('Action.UploadSimple')}
          onClick={onClick}
          className={`${placeholderAspectClass} ${previewSizeClass} flex items-center justify-center radius-medium clip stroke-none cursor-pointer bg-surface-100 hover:bg-surface-200 active:bg-surface-300 focus-visible:outline-focus`}>
          <Icon name='icon-regular-circle-plus' size='Large' />
        </button>
      )}
    </FileUploadBase>
  );

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    }
    handleChange(null);
    // handleChange is intentionally not memoized (see note above).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [handleChange, onReset]);

  /* eslint-disable react/react-compiler -- setState within this effect is intentional for asset-type switching; deferred cleanup per note below. */
  useEffect(() => {
    if (!(shouldShowPreview && imagePreviewRequiredAssetTypes.has(assetType))) {
      handleReset();
    }
    setShouldShowPreview(imagePreviewRequiredAssetTypes.has(assetType));
    if (droppedFile != null) {
      handleChange(droppedFile);
    }
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [assetType]);
  /* eslint-enable react/react-compiler */

  return (
    <Grid container item direction='row' className={styles.uploaderContainer} wrap='nowrap'>
      {shouldShowPreview && <Grid item>{imageContent}</Grid>}
      <Grid item>
        <div>
          <FileUploadBase
            accept={acceptedFileTypes?.map((type) => `.${type}`).join(',') ?? ''}
            size={maxFileSizeMB ? maxFileSizeMB * bytesPerMB : undefined}
            onChange={handleChange}
            className={styles.uploadButton}>
            {(onClick: () => void) => (
              <Button size='small' variant='outlined' color='primary' onClick={onClick}>
                {fileChangeButtonText}
              </Button>
            )}
          </FileUploadBase>
          {fileRemoveButtonText && (
            <Button
              className={styles.removeButton}
              size='small'
              variant='outlined'
              color='primary'
              onClick={handleRemoveFile}>
              {fileRemoveButtonText}
            </Button>
          )}
        </div>
        <div className={styles.fileUploadInfoContainer}>
          {currentFileName && (
            <>
              <FormHelperText>
                {translate('Message.CurrentlySelectedFile', { filename: currentFileName })}
              </FormHelperText>
              <br />
            </>
          )}
          {fileExtensionInfoDisplay && <FormHelperText>{fileExtensionInfoDisplay}</FormHelperText>}
          {assetTypeSpecificInfoSection && (
            <>
              <br />
              <FormHelperText>{assetTypeSpecificInfoSection}</FormHelperText>
            </>
          )}
          {attachmentLimitText && <FormHelperText>{attachmentLimitText}</FormHelperText>}
          {shouldShowPreview && <FormHelperText>{translate('Message.Moderation')}</FormHelperText>}
          {durationLimitText && (
            <FormHelperText data-testid='durationLimitText'>{durationLimitText}</FormHelperText>
          )}
          {resolutionInfoText && (
            <FormHelperText data-testid='resolutionInfoText'>{resolutionInfoText}</FormHelperText>
          )}
        </div>
      </Grid>
    </Grid>
  );
};

export default AssetUploader;

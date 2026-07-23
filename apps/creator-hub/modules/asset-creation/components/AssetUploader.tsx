import React, {
  Fragment,
  useCallback,
  useState,
  useEffect,
  FunctionComponent,
  useMemo,
} from 'react';
import { Grid, Button, ImageIcon, FormHelperText, Typography, Link } from '@rbx/ui';
import { FileUploadBase, Asset } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { bytesPerMB } from '@modules/miscellaneous/common/components/uploaders/constants/size';
import { FileRejectStatus } from '@modules/miscellaneous/common/components/uploaders/';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import useAssetUploaderStyles from './AssetUploader.styles';
import {
  fileTypeToMimeTypes,
  assetTypeToMimeCategory,
  imagePreviewRequiredAssetTypes,
} from '../constants/commonConstants';
import { assetTypeInfoTextMessage } from '../constants/AssetTypeConstants';

export type FileRejections = {
  file: File;
  errors: FileRejectStatus[];
};

export type AssetUploaderProps = {
  maxFileSizeMB?: number | null;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  // eslint-disable-next-line react/no-unused-prop-types -- See comment above.
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
      return changeText || translate('Action.Change');
    }
    return uploadText || translate('Action.UploadSimple');
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [newAssetUrl, uploadText, changeText, translate]);

  const fileRemoveButtonText = useMemo(() => {
    if (newAssetUrl || testAssetUrl) {
      return removeText || translate('Action.Remove');
    }
    return '';
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [newAssetUrl, translate]);

  const fileExtensionInfoDisplay = useMemo(() => {
    if (fileErrors && fileErrors.length > 0) {
      return (
        <Fragment>
          {fileErrors.map((e) => {
            switch (e) {
              case FileRejectStatus.FileWrongType:
                return (
                  <Typography color='error'>{translate('Message.WrongFormatError')}</Typography>
                );
              case FileRejectStatus.FileTooBig:
                return (
                  <Typography color='error'>
                    {translate('Message.MaxSizeExceededError', {
                      maxFileSize: `${maxFileSizeMB}MB`,
                    })}
                  </Typography>
                );
              default:
                return null;
            }
          })}
        </Fragment>
      );
    }
    return `${translate('Label.Format')} ${acceptedFileTypes?.map((type) => `*.${type}`).join(', ')}`;
  }, [translate, fileErrors, acceptedFileTypes, maxFileSizeMB]);

  const assetTypeSpecificInfoSection = useMemo(() => {
    if (infoText) {
      return infoText;
    }

    const typeSpecificMessage = assetTypeInfoTextMessage[assetType];
    if (typeSpecificMessage != null) {
      return translate(typeSpecificMessage);
    }
    return null;
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [infoText, assetType]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [durationLimit, translate]);

  const resolutionInfoText = useMemo(() => {
    return maxResolutionLimit
      ? translate('Message.MaxResolutionLimitText', {
          maxResolution: maxResolutionLimit ?? '',
        })
      : null;
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
  }, [maxResolutionLimit, translate]);

  const attachmentLimitText = useMemo(() => {
    if (!maxFileSizeMB) return null;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- See comment above.
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
      if (acceptMimeTypes?.indexOf(file.type) === -1) {
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

  const imageContent = useMemo(() => {
    if (newAssetUrl) {
      return <img className={styles.image} src={newAssetUrl} alt='preview' />;
    }
    return (
      <div className={styles.imageWrapper}>
        <Grid container className={styles.icon} justifyContent='center' alignItems='center'>
          <ImageIcon color='disabled' className={styles.iconSize} />
        </Grid>
      </div>
    );
  }, [newAssetUrl, styles]);

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    }
    handleChange(null);
  }, [handleChange, onReset]);

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

  return (
    <Grid container item direction='row' className={styles.uploaderContainer} wrap='nowrap'>
      {shouldShowPreview && (
        <Grid
          item
          container
          XSmall={4}
          Large={2}
          XLarge={1}
          justifyContent='center'
          alignItems='center'>
          <div className={styles.imageContainer}>{imageContent}</div>
        </Grid>
      )}
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
            <Fragment>
              <FormHelperText>
                {translate('Message.CurrentlySelectedFile', { filename: currentFileName })}
              </FormHelperText>
              <br />
            </Fragment>
          )}
          {fileExtensionInfoDisplay && <FormHelperText>{fileExtensionInfoDisplay}</FormHelperText>}
          {assetTypeSpecificInfoSection && (
            <Fragment>
              <br />
              <FormHelperText>{assetTypeSpecificInfoSection}</FormHelperText>
            </Fragment>
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

import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { Grid, ImageIcon, Button, FormHelperText } from '@rbx/ui';
import FileUploadBase from '../../FileUploadBase';
import { bytesPerMB } from '../constants/size';
import FileRejectStatus from '../enums/FileRejectStatus';
import useSingleImageUploadStyles from './SingleImageUploader.style';

export interface FileRejections {
  file: File;
  errors: FileRejectStatus[];
}

export interface SingleImageUploaderProps {
  acceptedImageTypes: string[];
  maxFileSizeMB?: number;
  imageUrl: string | null;
  imageAltText?: string;
  ariaDescribedBy?: string;
  imageComponent?: ReactNode;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  errorMessages?: string[];
  onChange?: (file: File) => void;
  onReject?: (rejection: FileRejections) => void;
  onRemove?: () => void;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  statusText?: string;
  uploadText: string;
  uploadAriaLabel?: string;
  removeText: string;
  removeButtonEnabled?: boolean;
  removeAriaLabel?: string;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  placeHolderText?: string;
  infoSection1?: ReactNode;
  infoSection2?: ReactNode;
  disabled?: boolean;
}

const SingleImageUploader: FunctionComponent<SingleImageUploaderProps> = (props) => {
  const {
    acceptedImageTypes,
    uploadAriaLabel,
    removeAriaLabel,
    ariaDescribedBy,
    imageUrl,
    imageAltText,
    imageComponent,
    maxFileSizeMB,
    onChange,
    onRemove,
    onReject,
    removeText,
    removeButtonEnabled = true,
    uploadText,
    infoSection1,
    infoSection2,
    disabled,
  } = props;
  const { classes: styles } = useSingleImageUploadStyles();
  const acceptMimeTypes = acceptedImageTypes.reduce<string[]>((prev, type) => {
    if (type === 'jpg' || type === 'jpeg') {
      if (!prev.includes('image/jpg')) {
        prev.push('image/jpg', 'image/jpeg');
      }
    } else {
      prev.push(`image/${type}`);
    }
    return prev;
  }, []);

  const handleChange = (files: FileList | null) => {
    if (files !== null && files.length > 0) {
      const file = files[0];
      const rejectionStatus: FileRejectStatus[] = [];
      if (maxFileSizeMB && file.size > maxFileSizeMB * bytesPerMB) {
        rejectionStatus.push(FileRejectStatus.FileTooBig);
      }
      if (!acceptMimeTypes.includes(file.type)) {
        rejectionStatus.push(FileRejectStatus.FileWrongType);
      }
      if (rejectionStatus.length > 0) {
        if (onReject) {
          onReject({
            file,
            errors: rejectionStatus,
          });
        }
      } else if (onChange) {
        onChange(file);
      }
    }
  };

  const imageContent = useMemo(() => {
    if (imageUrl) {
      return <img className={styles.image} src={imageUrl} alt={imageAltText} />;
    }
    if (imageComponent) {
      return <div className={styles.imageWrapper}>{imageComponent}</div>;
    }
    return (
      <div className={styles.imageWrapper}>
        <Grid container className={styles.icon} justifyContent='center' alignItems='center'>
          <ImageIcon color='disabled' className={styles.iconSize} />
        </Grid>
      </div>
    );
  }, [imageUrl, imageComponent, imageAltText, styles]);

  return (
    <Grid container item direction='row' className={styles.uploaderContainer} wrap='nowrap'>
      <Grid
        item
        classes={{ root: styles.imageGrid }}
        container
        XSmall={4}
        Large={2}
        XLarge={1}
        justifyContent='center'
        alignItems='center'>
        <div className={styles.imageContainer}>{imageContent}</div>
      </Grid>
      <Grid item classes={{ root: styles.fileInputGrid }}>
        <div>
          <FileUploadBase
            accept={acceptMimeTypes.join(',')}
            size={maxFileSizeMB ? maxFileSizeMB * bytesPerMB : undefined}
            onChange={handleChange}
            className={styles.uploadButton}>
            {(onClick: () => void) => (
              <Button
                size='medium'
                aria-describedby={ariaDescribedBy}
                aria-label={uploadAriaLabel}
                variant='outlined'
                color='primary'
                onClick={onClick}
                disabled={disabled}>
                {uploadText}
              </Button>
            )}
          </FileUploadBase>
          {removeButtonEnabled && removeText && (
            <Button
              aria-describedby={ariaDescribedBy}
              aria-label={removeAriaLabel}
              className={styles.removeButton}
              size='medium'
              variant='outlined'
              color='primary'
              onClick={onRemove}
              disabled={!imageUrl}>
              {removeText}
            </Button>
          )}
        </div>
        <div className={styles.imageUploadInfoContainer}>
          {infoSection1 && <FormHelperText>{infoSection1}</FormHelperText>}
          {infoSection2 && <FormHelperText>{infoSection2}</FormHelperText>}
        </div>
      </Grid>
    </Grid>
  );
};

export default SingleImageUploader;

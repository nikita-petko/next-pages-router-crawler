import { Button, Grid, Typography } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  SingleImageUploader,
  ImageDescription,
  FileRejectStatus,
  FileRejections,
} from '@modules/miscellaneous/common/components/uploaders';
import useIconImageUploaderStyles from './IconImageUploader.styles';
import {
  acceptedImageTypes,
  iconResolutionHeight,
  iconResolutionWidth,
  maxFileSizeMB,
} from '../constants';

export interface IconImageUploaderProps {
  imageInfo: ImageDescription;
  isLoading: boolean;
  onSave: (file: File | null) => void;
}

const IconImageUploader: FunctionComponent<React.PropsWithChildren<IconImageUploaderProps>> = ({
  imageInfo,
  isLoading,
  onSave,
}) => {
  const {
    classes: { iconHeader, text, reviewText, button },
  } = useIconImageUploaderStyles();
  const { translate } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(imageInfo.url);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[] | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const previousImageInfoRef = useRef<{
    url: string | null;
    statusText: string | null;
    key?: string;
  } | null>(null);

  // Reset internal state when imageInfo changes (e.g., language switch)
  // We depend on the actual values (url, statusText, and key) rather than the object reference
  // to ensure we catch changes even if the parent memoizes the object.
  // The 'key' property (imageId) is particularly important as it changes when language changes,
  // even if the URL values are the same (e.g., both languages have no image)
  useEffect(() => {
    const prevInfo = previousImageInfoRef.current;
    // Check if imageInfo values changed, including the key which identifies the specific image/language
    const hasChanged =
      !prevInfo ||
      prevInfo.url !== imageInfo.url ||
      prevInfo.statusText !== imageInfo.statusText ||
      prevInfo.key !== imageInfo.key;

    if (hasChanged) {
      // Reset state to match new imageInfo
      // This ensures that when switching languages, we reset any unsaved local changes
      setImageUrl((prevUrl) => {
        // Revoke old blob URL if it exists and is different from the new one
        if (prevUrl && prevUrl !== imageInfo.url && prevUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prevUrl);
        }
        return imageInfo.url ?? null;
      });
      setReviewStatus(imageInfo.statusText ?? null);
      setImageFile(null);
      setErrorMessages(null);
      // Store a copy of the current values, not the object reference
      previousImageInfoRef.current = {
        url: imageInfo.url ?? null,
        statusText: imageInfo.statusText ?? null,
        key: imageInfo.key,
      };
    }
  }, [imageInfo.url, imageInfo.statusText, imageInfo.key]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const currentImageInfo = useMemo(() => {
    return { url: imageUrl, statusText: reviewStatus };
  }, [imageUrl, reviewStatus]);

  const isSaveButtonDisabled = useMemo(() => {
    if (isLoading) {
      return true;
    }
    // If there's no original image and no current image, disable save
    if (!imageInfo.url && !currentImageInfo.url) {
      return true;
    }
    // If there's an original image but no current image (removed), enable save
    if (imageInfo.url && !currentImageInfo.url) {
      return false;
    }
    // If there's no original image but there's a current image (uploaded), enable save
    if (!imageInfo.url && currentImageInfo.url) {
      return false;
    }
    // If both exist, check if they're different
    return imageInfo.url === currentImageInfo.url;
  }, [imageInfo.url, currentImageInfo.url, isLoading]);

  const handleUploadFile = (file: File) => {
    // Revoke old blob URL if it exists
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);
    setReviewStatus(null);
    setErrorMessages(null);
  };

  const handleRemoveFile = () => {
    // Revoke blob URL if it exists
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setImageFile(null);
    setReviewStatus(null);
  };

  const handleRejectedImage = useCallback(
    (rejection: FileRejections) => {
      const innerErrorMessages = [];
      if (rejection.errors.find((error) => error === FileRejectStatus.FileWrongType)) {
        innerErrorMessages.push(translate('Message.WrongFormat'));
      }
      if (rejection.errors.find((error) => error === FileRejectStatus.FileTooBig)) {
        innerErrorMessages.push(translate('Message.FileTooBig'));
      }
      setErrorMessages(innerErrorMessages);
    },
    [translate],
  );

  return (
    <Grid container direction='column'>
      <Typography variant='largeLabel1' className={iconHeader}>
        {translate('Label.Icon')}
      </Typography>
      <Typography variant='largeLabel2' className={text}>{`${translate(
        'Label.AcceptableFiles',
      )} ${acceptedImageTypes.join(', ')}`}</Typography>
      <Typography variant='largeLabel2' className={text}>
        {`${translate(
          'Label.RecommendedResolution',
        )} ${iconResolutionWidth} x ${iconResolutionHeight}`}
      </Typography>
      <Typography variant='largeLabel2' className={text}>{`${translate(
        'Label.MaximumFileSize',
      )} ${maxFileSizeMB} MB`}</Typography>
      <Typography variant='largeLabel2' className={reviewText}>
        {translate('Description.ReviewImage')}
      </Typography>
      <SingleImageUploader
        acceptedImageTypes={acceptedImageTypes}
        maxFileSizeMB={maxFileSizeMB}
        imageUrl={currentImageInfo.url}
        uploadText={translate('Action.Upload')}
        removeText={translate('Action.Remove')}
        statusText={currentImageInfo.statusText ?? undefined}
        placeHolderText={translate('Label.NoImage')}
        errorMessages={errorMessages ?? []}
        onChange={handleUploadFile}
        onRemove={handleRemoveFile}
        onReject={handleRejectedImage}
      />
      <Grid item className={button}>
        <Button
          variant='contained'
          onClick={() => onSave(imageFile)}
          disabled={isSaveButtonDisabled}
          loading={isLoading}>
          {translate('Action.Save')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default IconImageUploader;

import type { FunctionComponent, ChangeEvent } from 'react';
import React, { useCallback, useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TButtonProps } from '@rbx/ui';
import {
  Button,
  DialogTemplate,
  FormHelperText,
  Grid,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { UploadImageThumbnailErrorCodes } from '@modules/clients/develop';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { MediaType } from '@modules/creations/placeThumbnails/types';
import type { thumbnailUploadHelper } from '@modules/creations/placeThumbnails/utils/placeThumbnailsHelper';
import EntityType from '../common/enums/EntityType';
import HttpStatusCodes from '../common/enums/HttpStatusCodes';
import { getEnumKeyByValue } from '../utils/enumUtils';
import useImageUploaderStyles from './ImageUploader.styles';

type assetMediaUploadFunction = (image: File) => Promise<void>;
type experienceMediaUploadFunction = typeof thumbnailUploadHelper;

export interface ImageUploaderProps {
  id: number;
  entity: EntityType;
  onFetchMediaList: () => Promise<void>;
  onUploadMedia: assetMediaUploadFunction | experienceMediaUploadFunction;
  disabled?: boolean;
  additionalInfo?: string;
  groupId?: number | undefined;
  isGroupUpload?: boolean;
  uploadButtonVariant?: TButtonProps['variant'];
  uploadButtonSize?: TButtonProps['size'];
  uploadButtonColor?: TButtonProps['color'];
}

const ImageUploader: FunctionComponent<React.PropsWithChildren<ImageUploaderProps>> = ({
  id,
  entity,
  onFetchMediaList,
  onUploadMedia,
  disabled = false,
  additionalInfo,
  groupId,
  isGroupUpload,
  uploadButtonVariant = 'outlined',
  uploadButtonSize = 'small',
  uploadButtonColor = 'primary',
}) => {
  const { translate } = useTranslation();
  const {
    classes: { information, inputStyle },
  } = useImageUploaderStyles();
  const { enqueue } = useSnackbar();
  const { configure, open, close: closeDialog } = useDialog();
  const [image, setImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthentication();
  const handleClickUpload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const acceptedFileExtensions = 'image/jpeg, image/gif, image/png, image/tga, image/bmp';

  const handleSetImage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.files?.[0] ?? null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setImage(null);
    closeDialog();
  }, [closeDialog]);

  const handleUploadImage = useCallback(async () => {
    try {
      if (image === null) {
        throw new Error('Image file is null');
      }
      setIsUploadingImage(true);
      setErrorMessage(null);
      if (entity === EntityType.Asset) {
        const uploadFunction = onUploadMedia as assetMediaUploadFunction;
        await uploadFunction(image);
      } else if (entity === EntityType.Experience) {
        const uploadFunction = onUploadMedia as experienceMediaUploadFunction;
        const errMessage = await uploadFunction(
          MediaType.Image,
          id,
          groupId,
          undefined,
          image,
          undefined,
          user?.id,
          isGroupUpload,
        );
        if (errMessage !== null) {
          throw new Error(errMessage);
        }
      } else {
        throw new Error('Must specify entity type to ImageUploader');
      }
      await onFetchMediaList();
      enqueue(
        {
          message: (
            <span data-testid='success-message'>
              {translate('Message.SuccessfullyUploadThumbnail')}
            </span>
          ),
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
    } catch (e) {
      const err = await tryParseResponseError(e);
      const status = getErrorStatus(e);
      const nameOfError =
        err && status !== HttpStatusCodes.INTERNAL_SERVER_ERROR
          ? getEnumKeyByValue(UploadImageThumbnailErrorCodes, err.code)
          : 'UnknownError';
      const errorMsgKey = `Error.${nameOfError}`;
      setErrorMessage(translate(errorMsgKey));
    } finally {
      setIsUploadingImage(false);
      handleCloseDialog();
    }
  }, [
    image,
    entity,
    onUploadMedia,
    onFetchMediaList,
    enqueue,
    translate,
    id,
    handleCloseDialog,
    user,
    groupId,
    isGroupUpload,
  ]);

  const confirmUploadImageDialog = useMemo(() => {
    return (
      <DialogTemplate
        variant='alert'
        color='primaryBrand'
        loading={isUploadingImage}
        title={translate('Label.AddThumbnail')}
        content={translate('Label.ConfirmUploadImageThumbnail')}
        cancelText={translate('Label.Cancel')}
        confirmText={translate('Label.Submit')}
        onCancel={handleCloseDialog}
        onConfirm={handleUploadImage}
      />
    );
  }, [handleCloseDialog, handleUploadImage, isUploadingImage, translate]);

  useEffect(() => {
    if (isUploadingImage) {
      configure(confirmUploadImageDialog);
    }
  }, [configure, confirmUploadImageDialog, isUploadingImage]);

  useEffect(() => {
    if (image !== null) {
      configure(confirmUploadImageDialog);
      open();
    }
  }, [configure, confirmUploadImageDialog, image, open]);

  return (
    <Grid>
      <Button
        variant={uploadButtonVariant}
        size={uploadButtonSize}
        color={uploadButtonColor}
        onClick={handleClickUpload}
        disabled={disabled}>
        {translate('Label.UploadImage')}
      </Button>
      <Grid className={information}>
        {errorMessage && (
          <Typography variant='smallLabel2' color='error'>
            {errorMessage}
          </Typography>
        )}
        <FormHelperText>{translate('Label.ImageFormat')}</FormHelperText>
        <>
          <br />
          <FormHelperText>{additionalInfo}</FormHelperText>
          <FormHelperText>{translate('Label.ImageThumbnailDescription')}</FormHelperText>
        </>
      </Grid>
      <input
        data-testid='file-input'
        className={inputStyle}
        accept={acceptedFileExtensions}
        ref={inputRef}
        type='file'
        onChange={handleSetImage}
      />
    </Grid>
  );
};

export default ImageUploader;

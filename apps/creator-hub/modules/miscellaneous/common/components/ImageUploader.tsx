import React, {
  FunctionComponent,
  useCallback,
  useState,
  Fragment,
  ChangeEvent,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import {
  Button,
  DialogTemplate,
  FormHelperText,
  Grid,
  TButtonProps,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  getErrorStatus,
  tryParseResponseError,
  UploadImageThumbnailErrorCodes,
} from '@modules/clients';
import { getEnumKeyByValue } from '@modules/miscellaneous/common/utils';
// eslint-disable-next-line no-restricted-imports -- needed to import
import { MediaType } from '@modules/creations/placeThumbnails/types';
// eslint-disable-next-line no-restricted-imports -- needed to import
import { thumbnailUploadHelper } from '@modules/creations/placeThumbnails/utils/placeThumbnailsHelper';
import useImageUploaderStyles from './ImageUploader.styles';
import EntityType from '../enums/EntityType';
import HttpStatusCodes from '../enums/HttpStatusCodes';

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
        <Fragment>
          <br />
          <FormHelperText>{additionalInfo}</FormHelperText>
          <FormHelperText>{translate('Label.ImageThumbnailDescription')}</FormHelperText>
        </Fragment>
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

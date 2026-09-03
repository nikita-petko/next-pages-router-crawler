import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  List,
  Grid,
  Typography,
  useSnackbar,
  useDialog,
  DialogTemplate,
  useMediaQuery,
} from '@rbx/ui';
import { AssetType } from '@modules/clients/assetsupload';
import {
  DeleteThumbnailErrorCodes,
  UploadImageThumbnailErrorCodes,
} from '@modules/clients/develop';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { HttpStatusCodes, EntityType } from '@modules/miscellaneous/common';
import { ImageUploader } from '@modules/miscellaneous/components';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils/enumUtils';
import MediaListItem from '../../../placeThumbnails/components/MediaListItem';
import MediaPreview from '../../../placeThumbnails/components/MediaPreview';
import useMediaListContainerStyles from '../../../placeThumbnails/containers/MediaListContainer.styles';
import { MediaType, type Thumbnail } from '../../../placeThumbnails/types';
import type { CreatorStoreConfigurationType } from '../../creatorStore/components/CreatorStoreConfiguration/types';
import useUploadImagePreviewsFormStyles from './UploadImagePreviewsForm.styles';

export type UploadImagePreviewsFormProps = {
  assetId: number;
  refetchPreviewIds: () => Promise<void>;
  uploadPreview: (uploadImage: File, fileAssetType: AssetType) => Promise<void>;
  deletePreview: (imageId: number) => Promise<void>;
  noticeMessage?: React.ReactNode;
};

// Max number of previews that the user can upload
const MAX_PREVIEWS = 5;
const FORM_FIELD_NAME = 'imagePreviewIds';
const UNKNOWN_ERROR = 'UnknownError';

const UploadImagePreviewsForm: FunctionComponent<
  React.PropsWithChildren<UploadImagePreviewsFormProps>
> = ({ assetId, refetchPreviewIds, uploadPreview, deletePreview, noticeMessage }) => {
  const { control, setValue, resetField, watch } = useFormContext<CreatorStoreConfigurationType>();
  const [isFetchingPreviews, setIsFetchingPreviews] = useState<boolean>(false);

  const imagePreviewIds = watch(FORM_FIELD_NAME);

  // MediaListComponent
  const { translate } = useTranslation();
  const {
    classes: { list, title, error },
  } = useMediaListContainerStyles();
  const {
    classes: { headerTitle, headerDescription },
  } = useUploadImagePreviewsFormStyles();
  const { enqueue } = useSnackbar();
  const { configure, open, close: closeDialog } = useDialog();
  const [isUpdatingListOrder, setIsUpdatingListOrder] = useState<boolean>(false);
  const [isDeletingPreview, setIsDeletingPreview] = useState<boolean>(false);
  const [previewIdForDeletion, setPreviewIdForDeletion] = useState<number | null>(null);
  const [deletionErrorMessage, setDeletionErrorMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(null);
  const [reorderedList, setReorderedList] = useState<number[]>([]);
  const [currentPreviewId, setCurrentPreviewId] = useState<number | null>(null);
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  useEffect(() => {
    // this means either the previews are first time fetched or has only been reordered
    setReorderedList((prevListOrder) => {
      if (prevListOrder.length === 0 || imagePreviewIds.length === prevListOrder.length) {
        return imagePreviewIds;
      }
      if (imagePreviewIds.length > prevListOrder.length) {
        const newListOrder = [...prevListOrder];
        imagePreviewIds.forEach((id, index) => {
          if (!newListOrder.some((innerItem) => innerItem === id)) {
            newListOrder.splice(index, 0, id);
          }
        });
        return Array.from(newListOrder);
      }

      return prevListOrder;
    });
  }, [imagePreviewIds]);

  const handleSelectPreviewThumbnail = useCallback((thumbnail: Thumbnail) => {
    setCurrentPreviewId(thumbnail.thumbnailId);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setPreviewIdForDeletion(null);
    closeDialog();
  }, [closeDialog]);

  const handleDeletePreview = useCallback(async () => {
    try {
      if (previewIdForDeletion === null) {
        throw new Error('Preview ID is null');
      }
      setIsDeletingPreview(true);
      setDeletionErrorMessage(null);
      await deletePreview(previewIdForDeletion);
      setReorderedList((prevListOrder) => {
        const newListOrder = [...prevListOrder];
        newListOrder.splice(
          newListOrder.findIndex((item) => item === previewIdForDeletion),
          1,
        );
        setValue(FORM_FIELD_NAME, newListOrder);
        return newListOrder;
      });
      if (previewIdForDeletion === currentPreviewId) {
        setCurrentPreviewId(null);
      }
      enqueue(
        {
          message: (
            <span data-testid='success-message'>
              {translate('Message.SuccessfullyDeleteThumbnail')}
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
          ? getEnumKeyByValue(DeleteThumbnailErrorCodes, err.code)
          : UNKNOWN_ERROR;
      const errorMsgKey = `Error.${nameOfError}`;
      setDeletionErrorMessage(translate(errorMsgKey));
    } finally {
      setPreviewIdForDeletion(null);
      setIsDeletingPreview(false);
      handleCloseDialog();
    }
  }, [
    previewIdForDeletion,
    deletePreview,
    currentPreviewId,
    enqueue,
    translate,
    setValue,
    handleCloseDialog,
  ]);

  // Dialog to confirm deleting asset media image
  const confirmDeleteDialog = useMemo(() => {
    return (
      <DialogTemplate
        variant='alert'
        color='destructive'
        loading={isDeletingPreview}
        title={translate('Label.DeleteThumbnail')}
        content={translate('Label.ConfirmDeleteThumbnail')}
        cancelText={translate('Label.Cancel')}
        confirmText={translate('Label.Delete')}
        onCancel={handleCloseDialog}
        onConfirm={handleDeletePreview}
      />
    );
  }, [handleCloseDialog, handleDeletePreview, isDeletingPreview, translate]);

  useEffect(() => {
    if (isDeletingPreview || previewIdForDeletion !== null) {
      configure(confirmDeleteDialog);
    }
  }, [configure, confirmDeleteDialog, isDeletingPreview, previewIdForDeletion]);

  // Rendering the Previews
  const previewItem = useMemo(() => {
    if (reorderedList.length === 0 || imagePreviewIds.length === 0) {
      return [];
    }
    return imagePreviewIds.reduce(
      (previousValue: React.ReactNode[], currentValue: number, currentIndex: number) => {
        const previewId = imagePreviewIds.find((id) => id === currentValue);
        if (!previewId) {
          return previousValue;
        }
        const thumbnailInfo: Thumbnail = {
          thumbnailId: previewId,
          imageId: previewId,
          type: MediaType.Image,
          assetId,
        };
        return [
          ...previousValue,
          <MediaListItem
            key={previewId}
            index={currentIndex}
            thumbnailInfo={thumbnailInfo}
            selectedThumbnailId={currentPreviewId ?? undefined}
            openDialog={open}
            isReordering={isUpdatingListOrder}
            setThumbnailIdForDeletion={setPreviewIdForDeletion}
            onSelectItem={handleSelectPreviewThumbnail}
          />,
        ];
      },
      [],
    );
  }, [
    reorderedList,
    imagePreviewIds,
    assetId,
    currentPreviewId,
    open,
    isUpdatingListOrder,
    handleSelectPreviewThumbnail,
  ]);

  const handleReorderList = useCallback(
    (srcIndex: number, desIndex: number) => {
      setReorderedList((prevListOrder) => {
        const newListOrder = [...prevListOrder];
        const itemToInsert = newListOrder.splice(srcIndex, 1);
        newListOrder.splice(desIndex, 0, ...itemToInsert);

        const previewsReordered = imagePreviewIds !== newListOrder;
        if (previewsReordered) {
          setValue(FORM_FIELD_NAME, Array.from(newListOrder), {
            shouldDirty: true,
          });
        } else {
          // Reset the field, since the ordering is back to the
          // 'default ordering' before we rearranged the Previews.
          resetField(FORM_FIELD_NAME, {
            defaultValue: imagePreviewIds,
          });
        }
        return Array.from(newListOrder);
      });
    },
    [imagePreviewIds, resetField, setValue],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }
      handleReorderList(result.source.index, result.destination.index);
      setIsUpdatingListOrder(false);
    },
    [handleReorderList],
  );

  const fetchPreviewIds = useCallback(async () => {
    try {
      setIsFetchingPreviews(true);
      await refetchPreviewIds();
      setIsFetchingPreviews(false);
    } catch (e) {
      const err = await tryParseResponseError(e);
      const status = getErrorStatus(e);
      const nameOfError =
        err && status !== HttpStatusCodes.INTERNAL_SERVER_ERROR
          ? getEnumKeyByValue(UploadImageThumbnailErrorCodes, err.code)
          : UNKNOWN_ERROR;
      const errorMsgKey = `Error.${nameOfError}`;
      setUploadErrorMessage(translate(errorMsgKey));
    }
  }, [refetchPreviewIds, translate]);

  const onUploadMedia = useCallback(
    async (image: File) => {
      await uploadPreview(image, AssetType.Image);
    },
    [uploadPreview],
  );

  useEffect(() => {
    if (isFetchingPreviews) {
      setDeletionErrorMessage(null);
      setReorderErrorMessage(null);
    }
  }, [isFetchingPreviews]);

  const mediaPreview = useMemo(() => {
    if (currentPreviewId) {
      return (
        <MediaPreview
          thumbnailId={currentPreviewId}
          mediaId={currentPreviewId}
          mediaType={MediaType.Image}
          altText=''
        />
      );
    }

    return null;
  }, [currentPreviewId]);

  return (
    <Controller
      name={FORM_FIELD_NAME}
      control={control}
      render={() => (
        <>
          <Grid item container direction='column' XSmall={12}>
            <Typography variant='h5' component='h2' className={headerTitle}>
              {translate('Label.Images')}
            </Typography>
            {noticeMessage && (
              <Typography variant='body2' color='secondary' className={headerDescription}>
                {noticeMessage}
              </Typography>
            )}
          </Grid>
          <Grid>
            <ImageUploader
              id={assetId}
              entity={EntityType.Asset}
              onFetchMediaList={fetchPreviewIds}
              disabled={imagePreviewIds.length >= MAX_PREVIEWS}
              additionalInfo={translate('Label.AssetMediaLimit', { limit: `${MAX_PREVIEWS}` })}
              onUploadMedia={onUploadMedia}
              uploadButtonVariant='contained'
              uploadButtonSize='medium'
              uploadButtonColor='primary'
            />
          </Grid>
          <Grid className={list} XSmall={12}>
            {imagePreviewIds.length !== 0 && (
              <>
                <Grid className={title}>
                  <Typography variant='overline' color='secondary'>
                    {translate('Label.Media')}
                  </Typography>
                </Grid>
                <Grid container XSmall={12} XLarge={8} direction={isCompactView ? 'column' : 'row'}>
                  <Grid item XSmall={12} Large={6}>
                    <DragDropContext
                      onDragEnd={(result) => handleDragEnd(result)}
                      onDragStart={() => setIsUpdatingListOrder(true)}
                      onDragUpdate={() => setIsUpdatingListOrder(false)}>
                      <Droppable droppableId='media-list' direction='vertical'>
                        {(provided) => (
                          <>
                            <List ref={provided.innerRef} {...provided.droppableProps}>
                              {previewItem}
                            </List>
                            {provided.placeholder}
                          </>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Grid>
                  <Grid container item XSmall={12} Medium={6} direction='column' wrap='nowrap'>
                    {mediaPreview}
                  </Grid>
                </Grid>
              </>
            )}
            <Grid XSmall={12}>
              {deletionErrorMessage && (
                <Grid className={error}>
                  <Typography variant='smallLabel2' color='error'>
                    {deletionErrorMessage}
                  </Typography>
                </Grid>
              )}
              {reorderErrorMessage && (
                <Grid className={error}>
                  <Typography variant='smallLabel2' color='error'>
                    {reorderErrorMessage}
                  </Typography>
                </Grid>
              )}
              {uploadErrorMessage && (
                <Grid className={error}>
                  <Typography variant='smallLabel2' color='error'>
                    {uploadErrorMessage}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </>
      )}
    />
  );
};

export default UploadImagePreviewsForm;

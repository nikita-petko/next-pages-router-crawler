import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import { extractStringValueFromError, getErrorStatus } from '@modules/clients/utils/errorHelpers';
import { updateUniverseIconAndThumbnailEventModel } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import MultiImageUploader from '@modules/miscellaneous/components/uploaders/components/MultiImageUploader';
import type { ImageRejectDescription } from '@modules/miscellaneous/components/uploaders/components/MultiImageUploader';
import FileRejectStatus from '@modules/miscellaneous/components/uploaders/enums/FileRejectStatus';
import type { ImageDescription } from '@modules/miscellaneous/components/uploaders/types';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import {
  acceptedImageTypes,
  maxFileSizeMB,
  maxFilesNumber,
  thumbnailResolutionHeight,
  thumbnailResolutionWidth,
} from '../constants';
import GameInfoField from '../enums/GameInfoField';
import arrayCompare from '../utils/arrayCompare';
import ImagePreview from './ImagePreview';
import useThumbnailImageUploaderStyles from './SaveGameInfoThumbnails.styles';

export interface ThumbnailImageUploaderProps {
  imageList: ImageDescription[];
  isLoading: boolean;
  onSaveSuccess: () => void;
}

const ThumbnailImageUploader: FunctionComponent<
  React.PropsWithChildren<ThumbnailImageUploaderProps>
> = ({ imageList, isLoading, onSaveSuccess }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const { gameId, currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const {
    classes: { thumbnailHeader, text, reviewText, saveButton },
  } = useThumbnailImageUploaderStyles();
  const [updatedImageList, setUpdatedImageList] = useState<ImageDescription[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(imageList[0]?.key || null);
  const bufferImageList = useRef<ImageDescription[] | null>(null);

  const currentImageList = useMemo(() => {
    if (bufferImageList.current === null) {
      bufferImageList.current = imageList;
      return Array.from(imageList);
    }
    if (!arrayCompare((a, b) => a === b)(bufferImageList.current, imageList)) {
      bufferImageList.current = imageList;
      return Array.from(imageList);
    }
    return updatedImageList;
  }, [imageList, updatedImageList]);

  const handleAddNewImage = (newFiles: File[]) => {
    setErrorMessages(null);
    const imageFilesToUpload = newFiles.map((file) => {
      const imageUrl = URL.createObjectURL(file);
      return {
        name: file.name,
        url: imageUrl,
        file,
        key: imageUrl,
      } as ImageDescription;
    });
    setUpdatedImageList(currentImageList.concat(imageFilesToUpload));
  };

  const handleRemoveImage = (key: string) => {
    const indexToDelete = currentImageList.findIndex((image) => image.key === key);
    if (indexToDelete > -1) {
      URL.revokeObjectURL(currentImageList[indexToDelete].url ?? '');
      currentImageList.splice(indexToDelete, 1);
      setUpdatedImageList(Array.from(currentImageList));
    }
  };

  const handleRejectImage = (fileRejectionMap: Map<FileRejectStatus, ImageRejectDescription>) => {
    const innerErrorMessages = [];
    if (fileRejectionMap.has(FileRejectStatus.TooManyFiles)) {
      innerErrorMessages.push(translate('Message.TooManyFiles'));
    }
    fileRejectionMap.get(FileRejectStatus.FileTooBig)?.relatedFiles.forEach((file) => {
      innerErrorMessages.push(`${file.name} ${translate('Message.IsTooBig')}`);
    });
    fileRejectionMap.get(FileRejectStatus.FileWrongType)?.relatedFiles.forEach((file) => {
      innerErrorMessages.push(`${file.name} ${translate('Message.IsOfWrongType')}`);
    });
    setErrorMessages(innerErrorMessages);
  };

  const handleReorderList = useCallback(
    (sourceIndexInOriginArray: number, destinationIndexInResultArray: number) => {
      const modifiedImageList = Array.from(currentImageList);
      // remove element at source index from array
      const elementToInsert = modifiedImageList.splice(sourceIndexInOriginArray, 1);
      // insert the element into destination index position
      modifiedImageList.splice(destinationIndexInResultArray, 0, ...elementToInsert);
      setUpdatedImageList(modifiedImageList);
    },
    [currentImageList],
  );

  const handleSelectImage = (imageKey: string) => {
    setSelectedKey(imageKey);
  };

  const selectedImage = useMemo(() => {
    const foundImage = currentImageList.find((x) => x.key === selectedKey);
    if (foundImage) {
      return foundImage;
    }
    setSelectedKey(currentImageList[0]?.key);
    return currentImageList[0];
  }, [selectedKey, currentImageList]);

  const imagesToUpdate = useMemo(() => {
    const originImageSetKeys = new Set(imageList.map((image) => image.key));
    const updatedImageSetKeys = new Set(currentImageList.map((image) => image.key));
    const imagesToAdd: ImageDescription[] = [];
    const imagesToDelete: ImageDescription[] = [];
    const imagesToUpdateAltText: ImageDescription[] = [];
    imageList.forEach((originImage) => {
      if (!updatedImageSetKeys.has(originImage.key)) {
        imagesToDelete.push(originImage);
      }
    });
    currentImageList.forEach((updatedImage) => {
      if (!originImageSetKeys.has(updatedImage.key)) {
        imagesToAdd.push(updatedImage);
      }
    });
    currentImageList.forEach((updatedImage) => {
      const originImage = imageList.find((x) => x.key === updatedImage.key);
      if (originImage !== undefined && originImage.altText !== updatedImage.altText) {
        imagesToUpdateAltText.push(updatedImage);
      }
    });
    return { imagesToAdd, imagesToDelete, imagesToUpdateAltText };
  }, [imageList, currentImageList]);

  const isSaveButtonDisabled = useMemo(() => {
    if (isLoading) {
      return true;
    }
    return arrayCompare((a, b) => a === b)(imageList, currentImageList);
  }, [imageList, currentImageList, isLoading]);

  const saveReorderedList = useCallback(async () => {
    try {
      if (!currentLanguageOrLocaleCode) {
        throw new Error('Current language code is undefined');
      }
      if (!gameId) {
        throw new Error('Game Id is null');
      }
      const imageIds = currentImageList.map((image) => parseInt(image.key, 10));
      await gameInternationalizationClient.orderGameThumbnails({
        gameId,
        languageCode: currentLanguageOrLocaleCode,
        request: { mediaAssetIds: imageIds },
      });
    } catch (e) {
      error(extractStringValueFromError(e, 'message', ''));
      showFailureToast(translate('Message.FailedToReorderImageList'));
    }
  }, [currentImageList, currentLanguageOrLocaleCode, error, gameId, showFailureToast, translate]);

  const updateGameThumbnailAltText = useCallback(
    async (thumbnailId: string, altText?: string) => {
      try {
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is undefined');
        }
        if (!gameId) {
          throw new Error('Game Id is null');
        }

        await gameInternationalizationClient.updateGameThumbnailAltText({
          gameId,
          languageCode: currentLanguageOrLocaleCode,
          altTextRequest: {
            thumbnailId: Number.parseFloat(thumbnailId),
            altText,
          },
        });

        trackerClient.sendEvent(
          updateUniverseIconAndThumbnailEventModel(
            gameId,
            GameInfoField.Thumbnails,
            currentLanguageOrLocaleCode,
            CreatorDashboardUserResponse.Update,
            200,
          ),
        );
      } catch (ex) {
        const errorStatus = getErrorStatus(ex, 500);
        trackerClient.sendEvent(
          updateUniverseIconAndThumbnailEventModel(
            gameId,
            GameInfoField.Thumbnails,
            currentLanguageOrLocaleCode,
            CreatorDashboardUserResponse.Update,
            errorStatus,
          ),
        );
        showFailureToast(`${translate('Message.FailedToUpdateAltText')} ${thumbnailId}`);
        throw new Error(`Failed to update alt text for ${thumbnailId}`, { cause: ex });
      }
    },
    [currentLanguageOrLocaleCode, gameId, showFailureToast, trackerClient, translate],
  );

  const handleClickSave = useCallback(async () => {
    try {
      if (!currentLanguageOrLocaleCode) {
        throw new Error('Language code is undefined');
      }
      if (!gameId) {
        throw new Error('Game Id is null');
      }
      setIsUpdating(true);
      await saveReorderedList();
      for (const imageToAdd of imagesToUpdate.imagesToAdd) {
        try {
          const res = await gameInternationalizationClient.updateGameThumbnail({
            gameId,
            languageCode: currentLanguageOrLocaleCode,
            files: imageToAdd.file,
          });
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Thumbnails,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Upload,
              200,
            ),
          );

          if (res.mediaAssetId === undefined) {
            throw new Error('mediaAssetId is undefined');
          }

          if (imageToAdd.altText) {
            await updateGameThumbnailAltText(res.mediaAssetId, imageToAdd.altText);
          }
        } catch (e) {
          const errorStatus = getErrorStatus(e, 500);
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Thumbnails,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Upload,
              errorStatus,
            ),
          );
          showFailureToast(`${translate('Message.FailedToSaveImage')} ${imageToAdd.name}`);
          throw new Error(`Failed to save ${imageToAdd.name}`, { cause: e });
        }
      }
      for (const imageToDelete of imagesToUpdate.imagesToDelete) {
        try {
          await gameInternationalizationClient.deleteGameThumbnail({
            gameId,
            languageCode: currentLanguageOrLocaleCode,
            imageId: parseInt(imageToDelete.key, 10),
          });
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Thumbnails,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Delete,
              200,
            ),
          );
        } catch (ex) {
          const errorStatus = getErrorStatus(ex, 500);
          trackerClient.sendEvent(
            updateUniverseIconAndThumbnailEventModel(
              gameId,
              GameInfoField.Thumbnails,
              currentLanguageOrLocaleCode,
              CreatorDashboardUserResponse.Delete,
              errorStatus,
            ),
          );
          showFailureToast(`${translate('Message.FailedToDeleteImage')} ${imageToDelete.key}`);
          throw new Error(`Failed to delete ${imageToDelete.key}`, { cause: ex });
        }
      }
      for (const imageToUpdateAltText of imagesToUpdate.imagesToUpdateAltText) {
        await updateGameThumbnailAltText(imageToUpdateAltText.key, imageToUpdateAltText.altText);
      }
      showSuccessToast(translate('Message.ThumbnailsUpdated'));
      onSaveSuccess();
    } catch (e) {
      error(extractStringValueFromError(e, 'message', ''));
    } finally {
      setIsUpdating(false);
    }
  }, [
    currentLanguageOrLocaleCode,
    error,
    gameId,
    imagesToUpdate.imagesToAdd,
    imagesToUpdate.imagesToDelete,
    imagesToUpdate.imagesToUpdateAltText,
    onSaveSuccess,
    saveReorderedList,
    showFailureToast,
    showSuccessToast,
    trackerClient,
    translate,
    updateGameThumbnailAltText,
  ]);

  const updateAltText = (altText: string) => {
    const modifiedImageList = [...currentImageList];

    const updateIndex = modifiedImageList.findIndex((x) => x.key === selectedKey);
    const replacementImage = { ...modifiedImageList[updateIndex] };
    replacementImage.altText = altText;
    modifiedImageList[updateIndex] = replacementImage;
    setUpdatedImageList(modifiedImageList);
  };

  return gameId && currentLanguageOrLocaleCode ? (
    <>
      <Grid className={thumbnailHeader}>
        <Typography variant='largeLabel1'>{translate('Label.Thumbnails')}</Typography>
      </Grid>
      <Grid container direction='column'>
        <Typography variant='largeLabel2' className={text}>
          {`${translate('Label.ScreenshotsLimitPrefix')} ${maxFilesNumber} ${translate(
            'Label.ScreenshotsLimitSuffix',
          )}`}
        </Typography>
        <Typography variant='largeLabel2' className={text}>{`${translate(
          'Label.AcceptableFiles',
        )} ${acceptedImageTypes.join(', ')}`}</Typography>
        <Typography variant='largeLabel2' className={text}>
          {`${translate(
            'Label.RecommendedResolution',
          )} ${thumbnailResolutionWidth} x ${thumbnailResolutionHeight}`}
        </Typography>
        <Typography variant='largeLabel2' className={text}>{`${translate(
          'Label.MaximumFileSize',
        )} ${maxFileSizeMB} MB`}</Typography>
        <Typography variant='largeLabel2' className={reviewText}>
          {translate('Description.ReviewImage')}
        </Typography>
      </Grid>
      <MultiImageUploader
        imageList={currentImageList}
        acceptedImageTypes={acceptedImageTypes}
        uploadButtonText={translate('Action.UploadThumbnails')}
        placeholderForEmpty={translate('Label.NoImage')}
        maxSizeMB={maxFileSizeMB}
        maxCount={maxFilesNumber}
        errorMessage={errorMessages ?? []}
        selectedKey={selectedImage?.key}
        onRemove={handleRemoveImage}
        onReorder={handleReorderList}
        onAdd={handleAddNewImage}
        onReject={handleRejectImage}
        onSelect={handleSelectImage}
        imagePreview={
          selectedImage ? (
            <ImagePreview
              src={selectedImage.url}
              altText={selectedImage.altText}
              updateAltText={updateAltText}
            />
          ) : undefined
        }
      />
      <Button
        className={saveButton}
        variant='contained'
        onClick={handleClickSave}
        disabled={isSaveButtonDisabled}
        loading={isUpdating}>
        {translate('Action.Save')}
      </Button>
    </>
  ) : null;
};

export default ThumbnailImageUploader;

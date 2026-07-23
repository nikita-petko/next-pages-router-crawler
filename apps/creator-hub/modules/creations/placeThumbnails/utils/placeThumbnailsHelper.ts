// eslint-disable-next-line no-restricted-imports -- seems to be the only way to import
import { MediaType } from '@modules/creations/placeThumbnails/types';
import assetsUploadApiClient, {
  Creator,
  CreationContext,
  AssetType,
  FieldMask,
} from '@modules/clients/assetsupload';
import { PreviewFromJSON } from '@rbx/clients/assetsUploadApi';

const previewFieldMaskArray = [FieldMask.PREVIEWS];
const iconFieldMaskArray = [FieldMask.ICON];
const assetUploadOperationStatusPollingIntervalSeconds = 1;
const assetUploadOperationStatusPollingMaxRetries = 25;
const assetUploadThumbnailVideoPrice = 500;

// The polling pattern for calling assets upload api is documented here: https://roblox.atlassian.net/wiki/spaces/CON/pages/2493153717/Asset+Media+APIs+Migration+Guide

export async function pollForCompletedOperation(
  operationId: string,
  currentAttempt: number,
): Promise<null> {
  const operation = await assetsUploadApiClient.getOperationStatus(operationId);
  const isOperationDone = operation?.done ?? false;

  if (isOperationDone && operation?.error == null) {
    return null;
  }

  if (currentAttempt > assetUploadOperationStatusPollingMaxRetries) {
    throw operation?.error?.message ?? 'Exceeded polling retry limit';
  }

  if (isOperationDone && operation?.error != null) {
    throw operation?.error?.message ?? 'AssetCreationFailed';
  }

  await new Promise((r) => setTimeout(r, 1000 * assetUploadOperationStatusPollingIntervalSeconds));

  return pollForCompletedOperation(operationId, currentAttempt + 1);
}

export async function pollForNewAssetIdAndAssociate(
  operationId: string,
  currentAttempt: number,
  placeId: number,
): Promise<null> {
  const operation = await assetsUploadApiClient.getOperationStatus(operationId);
  const isOperationDone = operation?.done ?? false;

  if (isOperationDone && operation?.error == null) {
    const previewId = operation?.response?.assetId;
    const stringPreviewId = previewId ? previewId.toString() : '';

    const newPreviewItem = PreviewFromJSON({
      asset: `assets/${stringPreviewId}`,
      altText: '',
    });

    const currentPreviewListResponse = await assetsUploadApiClient.getAsset(
      placeId,
      previewFieldMaskArray,
    );
    const currentPreviewList = currentPreviewListResponse.previews ?? [];
    const newPreviewList = [newPreviewItem, ...currentPreviewList];

    const updateRequestInfo = {
      assetId: placeId,
      previews: newPreviewList,
    };

    const associateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
      placeId,
      previewFieldMaskArray,
      updateRequestInfo,
    );

    return pollForCompletedOperation(associateOperationId, 0);
  }

  if (currentAttempt > assetUploadOperationStatusPollingMaxRetries) {
    throw operation?.error?.message ?? 'Exceeded polling retry limit';
  }

  if (isOperationDone && operation?.error != null) {
    throw operation?.error?.message ?? 'AssetCreationFailed';
  }

  await new Promise((r) => setTimeout(r, 1000 * assetUploadOperationStatusPollingIntervalSeconds));
  return pollForNewAssetIdAndAssociate(operationId, currentAttempt + 1, placeId);
}

export async function pollForNewAssetIdAndAssociateIcon(
  operationId: string,
  currentAttempt: number,
  placeId: number,
): Promise<null> {
  const operation = await assetsUploadApiClient.getOperationStatus(operationId);
  const isOperationDone = operation?.done ?? false;

  if (isOperationDone && operation?.error == null) {
    const iconAssetId = operation?.response?.assetId;
    const stringIconAssetId = iconAssetId ? iconAssetId.toString() : '';
    const updateRequestInfo = {
      assetId: placeId,
      icon: `assets/${stringIconAssetId}`,
    };

    const associateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
      placeId,
      iconFieldMaskArray,
      updateRequestInfo,
    );

    return pollForCompletedOperation(associateOperationId, 0);
  }
  if (currentAttempt > assetUploadOperationStatusPollingMaxRetries) {
    throw operation?.error?.message ?? 'Exceeded polling retry limit';
  }

  if (isOperationDone && operation?.error != null) {
    throw operation?.error?.message ?? 'AssetCreationFailed';
  }

  await new Promise((r) => setTimeout(r, 1000 * assetUploadOperationStatusPollingIntervalSeconds));
  return pollForNewAssetIdAndAssociateIcon(operationId, currentAttempt + 1, placeId);
}

export async function thumbnailUploadHelper(
  thumbnailMediaType: MediaType,
  placeId: number,
  groupId: number | undefined,
  videoUrl?: string,
  imageFile?: File,
  autoGenImageUrl?: string,
  userId?: number,
  isGroupUpload?: boolean,
): Promise<string | null> {
  const creator: Creator = isGroupUpload ? { groupId } : { userId };
  const creationContext: CreationContext = {
    creator,
    expectedPrice: thumbnailMediaType === MediaType.Video ? assetUploadThumbnailVideoPrice : 0,
  };
  const uploadRequestInfo =
    thumbnailMediaType === MediaType.Video
      ? {
          assetType: AssetType.YoutubeVideo,
          displayName: `Asset Thumbnail`, // Will not be displayed
          creationContext,
        }
      : {
          assetType: AssetType.Image,
          displayName: `Asset Thumbnail`, // Will not be displayed
          creationContext,
        };

  let uploadOperationId = '';
  if (thumbnailMediaType === MediaType.AutoGeneratedImage && autoGenImageUrl !== undefined) {
    const r = await fetch(autoGenImageUrl ?? '');
    const blobFile = await r.blob();
    const imageUrlFileBlob = new File([blobFile], 'autoGenIcon', { type: 'image/png' });
    uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
      uploadRequestInfo,
      imageUrlFileBlob as Blob,
      true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
    );
  }

  if (thumbnailMediaType === MediaType.Video && videoUrl !== undefined) {
    const videoUrlString = videoUrl ? videoUrl.toString() : '';
    const videoUrlBlob = new Blob([videoUrlString], { type: 'text/plain' });
    const textFileVideo = new File([videoUrlBlob], 'foo.txt', { type: 'text/plain' });

    uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
      uploadRequestInfo,
      textFileVideo as Blob,
      true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
    );
  }

  if (thumbnailMediaType === MediaType.Image && imageFile !== undefined) {
    uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
      uploadRequestInfo,
      imageFile as Blob,
      true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
    );
  }

  if (uploadOperationId === '') {
    throw new Error('Error: empty uploadOperationId');
  }

  await pollForNewAssetIdAndAssociate(uploadOperationId, 0, placeId);
  return null;
}

export async function deleteThumbnailAssetsApi(
  placeId: number,
  thumbnailAssetId: number,
): Promise<string | null> {
  const currentPreviewListResponse = await assetsUploadApiClient.getAsset(
    placeId,
    previewFieldMaskArray,
  );
  const currentPreviewList = currentPreviewListResponse.previews ?? [];
  const newPreviewList = currentPreviewList.filter(
    (preview) => preview.asset !== `assets/${thumbnailAssetId.toString()}`,
  );

  const updateRequestInfo = {
    assetId: placeId,
    previews: newPreviewList,
  };

  const associateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
    placeId,
    previewFieldMaskArray,
    updateRequestInfo,
  );

  return pollForCompletedOperation(associateOperationId, 0);
}

export async function setDefaultPlaceIcon(placeId: number): Promise<void> {
  const deleteRequestInfo = {
    assetId: placeId,
    icon: ``,
  };
  const deleteIconOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
    placeId,
    iconFieldMaskArray,
    deleteRequestInfo,
  );
  await pollForCompletedOperation(deleteIconOperationId, 0);
}

export async function setAutogeneratedPlaceIcon(
  placeId: number,
  autoGenIconImageUrl: string,
  isGroupUpload: boolean,
  userId: number | undefined,
  groupId: number | undefined,
): Promise<void> {
  const creator: Creator = isGroupUpload ? { groupId } : { userId };
  const creationContext: CreationContext = { creator };
  const uploadRequestInfo = {
    assetType: AssetType.Image,
    displayName: `Asset Icon`, // Will not be displayed
    creationContext,
  };
  const imageUrlFileBlob = await fetch(autoGenIconImageUrl)
    .then((r) => r.blob())
    .then((blobFile) => new File([blobFile], 'autoGenIcon', { type: 'image/png' }));
  const uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
    uploadRequestInfo,
    imageUrlFileBlob as Blob,
    true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
  );
  await pollForNewAssetIdAndAssociateIcon(uploadOperationId, 0, placeId);
}

export async function setUploadedPlaceIconNew(
  placeId: number,
  fileBlob: Blob,
  isGroupUpload: boolean,
  userId: number | undefined,
  groupId: number | undefined,
): Promise<void> {
  const creator: Creator = isGroupUpload ? { groupId } : { userId };
  const creationContext: CreationContext = { creator };
  const uploadRequestInfo = {
    assetType: AssetType.Image,
    displayName: `Asset Icon`, // Will not be displayed
    creationContext,
  };
  const uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
    uploadRequestInfo,
    fileBlob,
    true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
  );
  await pollForNewAssetIdAndAssociateIcon(uploadOperationId, 0, placeId);
}

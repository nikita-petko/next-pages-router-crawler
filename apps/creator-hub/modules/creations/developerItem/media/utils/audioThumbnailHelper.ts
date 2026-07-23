import assetsUploadApiClient, {
  type Creator,
  type CreationContext,
  AssetType,
  FieldMask,
} from '@modules/clients/assetsupload';
import { pollForCompletedOperation } from '@modules/clients/assetsUploadPolling';
import { cropImageToSquare } from '@modules/miscellaneous/utils/imageUtils';

export async function uploadAudioThumbnail(
  audioAssetId: number,
  fileBlob: Blob,
  isGroupUpload: boolean,
  userId: number | undefined,
  groupId: number | undefined,
): Promise<number> {
  const creator: Creator = isGroupUpload ? { groupId } : { userId };
  const creationContext: CreationContext = { creator };
  const squareBlob = await cropImageToSquare(fileBlob);
  const uploadRequestInfo = {
    assetType: AssetType.Image,
    displayName: 'Asset Icon',
    creationContext,
  };
  const uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
    uploadRequestInfo,
    squareBlob,
    true,
  );
  const iconAssetId = await pollForCompletedOperation(uploadOperationId, 0);
  if (!iconAssetId) {
    throw new Error('Operation completed but returned no assetId.');
  }
  const updateRequestInfo = {
    assetId: audioAssetId,
    creationContext,
    icon: `assets/${iconAssetId}`,
  };
  const associateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
    audioAssetId,
    [FieldMask.ICON],
    updateRequestInfo,
  );
  await pollForCompletedOperation(associateOperationId, 0);
  return iconAssetId;
}

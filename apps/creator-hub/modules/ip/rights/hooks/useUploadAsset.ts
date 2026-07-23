import { useMutation } from '@tanstack/react-query';
import type { Asset, AssetPrivacy, AssetType, Creator } from '@rbx/client-assets-upload-api/v1';
import assetsUploadApiClient from '@modules/clients/assetsupload';

export interface AssetCreationDetails {
  creationContext: {
    creator: Creator;
    assetPrivacy?: AssetPrivacy;
  };
  assetType: AssetType;
  displayName: string;
  description?: string;
}

/**
 * Uploads an asset to Roblox and then polls for the operation's result.
 * @param {Object} param
 * @param {Blob} param.file - Asset file to upload
 * @param {AssetCreationDetails} param.asset - Metadata about the asset
 * @returns {Promise<Asset>} - The uploaded asset
 */
export const uploadAsset = async ({
  file,
  asset,
}: {
  file: Blob;
  asset: AssetCreationDetails;
}): Promise<Asset> => {
  if (file === null) {
    throw new Error('File is required');
  }
  const operationId = await assetsUploadApiClient.createAssetAndGetOperationId(asset, file);
  const maxTime = 30000; // 30s
  const pollInterval = 500; // 0.5s
  const startTime = Date.now();
  while (Date.now() - startTime < maxTime) {
    const operation = await assetsUploadApiClient.getOperationStatus(operationId);
    if (operation?.done && operation?.response) {
      return operation.response;
    }
    if (operation?.error) {
      throw new Error(`Operation failed: ${operation.error.code}: ${operation.error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
  throw new Error('Upload polling timed out');
};

/**
 * Provides a useMutation hook for uploading assets to Roblox.
 */
const useUploadAsset = () => {
  const mutation = useMutation({
    mutationFn: uploadAsset,
  });
  return mutation;
};

export default useUploadAsset;

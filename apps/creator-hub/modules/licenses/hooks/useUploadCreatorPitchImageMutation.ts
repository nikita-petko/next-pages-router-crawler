import { useMutation } from '@tanstack/react-query';
import assetsUploadApiClient from '@modules/clients/assetsupload';

export interface CreateCreatorPitchImageUploadOperationParams {
  file: File;
  userId: number;
}

/**
 * Starts a pitch-attachment image upload via the assets upload API.
 *
 * Returns the long-running operation ID to poll with `useAssetsUploadOperationStatusPolling`.
 */
export async function createCreatorPitchImageUploadOperation({
  file,
  userId,
}: CreateCreatorPitchImageUploadOperationParams): Promise<string> {
  const displayName = file.name.replace(/\.[^.]+$/, '').trim() || 'pitch_attachment';

  return assetsUploadApiClient.createAssetAndGetOperationId(
    {
      creationContext: {
        creator: { userId },
      },
      assetType: 'Image',
      displayName,
    },
    file,
  );
}

const useUploadCreatorPitchImageMutation = () => {
  return useMutation({
    mutationFn: createCreatorPitchImageUploadOperation,
  });
};

export default useUploadCreatorPitchImageMutation;

import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Status } from '@rbx/client-assets-upload-api/v1';
import { useTranslation } from '@rbx/intl';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import usePollOperationForAssetUploadMutation from './usePollOperationForAssetUploadMutation';

class UpdateOperationError extends Error {
  public status?: Status = undefined;

  constructor(message: string, status?: Status) {
    super(message);
    this.status = status;
  }
}

const previewFieldMaskArray = [FieldMask.PREVIEWS];

const useDisassociateAssetFromPlaceMutation = (
  placeId: number,
  onSuccess?: () => void,
  onError?: (reason: string) => void,
) => {
  const { translate } = useTranslation();
  const { pollForCompletedOperationAsync: pollForUpdateOperationAync } =
    usePollOperationForAssetUploadMutation();

  const {
    mutate: disassociateAssetFromPlace,
    mutateAsync: disassociateAssetFromPlaceAsync,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async (assetId: number) => {
      // create a new preview list without the asset to be disassociated
      const currentPreviewListResponse = await assetsUploadApiClient.getAsset(
        placeId,
        previewFieldMaskArray,
      );
      const currentPreviewList = currentPreviewListResponse.previews ?? [];
      const newPreviewList = currentPreviewList.filter(
        (preview) => preview.asset !== `assets/${assetId.toString()}`,
      );

      // update the place with the new preview list
      const updateRequestInfo = {
        assetId: placeId,
        previews: newPreviewList,
      };
      const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        placeId,
        previewFieldMaskArray,
        updateRequestInfo,
      );
      const updateOperation = await pollForUpdateOperationAync(updateOperationId);
      if (!updateOperation.response) {
        throw new UpdateOperationError(
          'Associate uploaded asset to place operation failed',
          updateOperation.error,
        );
      }
      return updateOperation.response;
    },
    onSuccess,
    onError: (error) => {
      const unknownError = translate('Error.UnknownError');
      if (error instanceof UpdateOperationError) {
        onError?.(error.status?.message ?? unknownError);
      } else {
        onError?.(unknownError);
      }
    },
  });

  return useMemo(
    () => ({
      disassociateAssetFromPlace,
      disassociateAssetFromPlaceAsync,
      isUpdating,
    }),
    [disassociateAssetFromPlace, disassociateAssetFromPlaceAsync, isUpdating],
  );
};
export default useDisassociateAssetFromPlaceMutation;

import { useMemo } from 'react';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePollOperationForAssetUploadMutation from './usePollOperationForAssetUploadMutation';
import { UpdateOperationError } from './useReorderThumbnailsForPlaceMutation';
import { getPlaceMediaQueryKey } from './useGetPlaceMediaQuery';

const useUpdateAltTextForPlaceMutation = (
  onSuccess?: () => void,
  onError?: (error: Error) => void,
) => {
  const queryClient = useQueryClient();
  const { pollForCompletedOperationAsync: pollForUpdateOperationAync } =
    usePollOperationForAssetUploadMutation();
  const {
    mutate: updateThumbnailAltTextForPlace,
    mutateAsync: updateThumbnailAltTextForPlaceAsync,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async ({
      placeId,
      assetId,
      altText,
    }: {
      placeId: number;
      assetId: string;
      altText: string;
    }) => {
      const currentPreviewListResponse = await assetsUploadApiClient.getAsset(placeId, [
        FieldMask.PREVIEWS,
      ]);
      const currentPreviewList = currentPreviewListResponse.previews ?? [];

      const updatedPreviewList = currentPreviewList.map((preview) => {
        const id = preview.asset ? preview.asset.split('/').pop() : '';
        if (id === assetId) {
          return {
            ...preview,
            altText,
          };
        }
        return preview;
      });

      const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        placeId,
        [FieldMask.PREVIEWS],
        {
          assetId: placeId,
          previews: updatedPreviewList,
        },
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
    onSuccess: (_, { placeId }) => {
      queryClient.invalidateQueries({ queryKey: getPlaceMediaQueryKey(placeId) });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError,
  });

  return useMemo(
    () => ({
      updateThumbnailAltTextForPlace,
      updateThumbnailAltTextForPlaceAsync,
      isUpdating,
    }),
    [isUpdating, updateThumbnailAltTextForPlace, updateThumbnailAltTextForPlaceAsync],
  );
};

export default useUpdateAltTextForPlaceMutation;

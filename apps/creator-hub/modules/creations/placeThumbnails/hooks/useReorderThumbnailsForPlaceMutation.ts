import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Preview, Status } from '@rbx/client-assets-upload-api/v1';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import { getPlaceMediaQueryKey } from './useGetPlaceMediaQuery';
import usePollOperationForAssetUploadMutation from './usePollOperationForAssetUploadMutation';

export class UpdateOperationError extends Error {
  public status?: Status = undefined;

  constructor(message: string, status?: Status) {
    super(message);
    this.status = status;
  }
}

const useReorderThumbnailsForPlaceMutation = (
  onSuccess?: () => void,
  onError?: (error: Error) => void,
) => {
  const queryClient = useQueryClient();
  const { pollForCompletedOperationAsync: pollForUpdateOperationAync } =
    usePollOperationForAssetUploadMutation();
  const {
    mutate: reorderThumbnailsForPlace,
    mutateAsync: reorderThumbnailsForPlaceAsync,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async ({
      placeId,
      newPreviewOrder,
      videoPreview,
    }: {
      placeId: number;
      newPreviewOrder: number[];
      videoPreview: Preview | undefined;
    }) => {
      const currentPreviewListResponse = await assetsUploadApiClient.getAsset(placeId, [
        FieldMask.PREVIEWS,
      ]);
      const currentPreviewList = currentPreviewListResponse.previews ?? [];

      // Use a map to reorder the current preview list according to reorderedList
      const assetToPreviewMap = new Map<string, Preview>();
      currentPreviewList.forEach((item) => {
        const assetId = item.asset ? item.asset.split('/').pop() : ''; // extract assetId from "assets/{assetId}"
        if (assetId !== undefined) {
          assetToPreviewMap.set(assetId, item);
        }
      });

      const reorderedPreviewsList: Preview[] = [];
      if (videoPreview) {
        reorderedPreviewsList.push(videoPreview);
      }

      newPreviewOrder.forEach((assetId) => {
        const previewReordered = assetToPreviewMap.get(assetId.toString());
        if (previewReordered) {
          reorderedPreviewsList.push(previewReordered);
        }
      });

      const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        placeId,
        [FieldMask.PREVIEWS],
        {
          assetId: placeId,
          previews: reorderedPreviewsList,
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
      void queryClient.invalidateQueries({
        queryKey: getPlaceMediaQueryKey(placeId),
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError,
  });

  return useMemo(
    () => ({
      reorderThumbnailsForPlace,
      reorderThumbnailsForPlaceAsync,
      isUpdating,
    }),
    [isUpdating, reorderThumbnailsForPlace, reorderThumbnailsForPlaceAsync],
  );
};

export default useReorderThumbnailsForPlaceMutation;

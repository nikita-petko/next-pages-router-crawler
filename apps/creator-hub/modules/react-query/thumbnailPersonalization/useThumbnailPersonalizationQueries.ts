import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type {
  FindThumbnailsResponse,
  HomepageThumbnail,
} from '@rbx/client-thumbnail-personalization-api/v1';
import {
  HomepageThumbnailStatus,
  ModerationStatus,
  PersonalizedConfigStatus,
  UploadStatus,
} from '@rbx/client-thumbnail-personalization-api/v1';
import type { RobloxWebResponsesThumbnailsThumbnailResponse } from '@rbx/client-thumbnails/v1';
import {
  RobloxWebResponsesThumbnailsThumbnailResponseStateEnum,
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { useTranslation } from '@rbx/intl';
import { getThumbnailsClient } from '@rbx/thumbnails';
import {
  createHomepageThumbnailPersonalization,
  deleteHomepageThumbnail,
  findHomepageThumbnailPersonalizations,
  getHomepageThumbnails,
  pollUploadMultipleHomepageThumbnailsStatus,
  updateHomepageThumbnailPersonalization,
  uploadMultipleHomepageThumbnails,
} from './thumbnailPersonalizationRequests';
import type { PersonalizedThumbnail } from './types';

const queryKeyPrefix = 'thumbnailPersonalizationApi';

export const getHomepageThumbnailsQueryKey = (universeId?: number, cursor?: string) =>
  [`${queryKeyPrefix}-getHomepageThumbnails`, universeId, cursor] as const;

export const useGetHomepageThumbnailsQuery = (universeId?: number, cursor?: string) => {
  const select = useCallback(
    ({
      homepageThumbnails,
      nextCursor,
      assets,
    }: {
      homepageThumbnails: HomepageThumbnail[];
      nextCursor: string | undefined | null;
      assets: RobloxWebResponsesThumbnailsThumbnailResponse[] | undefined;
    }) => {
      const imageAssetByAssetId = assets?.reduce((acc, curr) => {
        if (!curr.targetId || !curr.imageUrl) {
          return acc;
        }
        acc.set(curr.targetId, curr);
        return acc;
      }, new Map<number, RobloxWebResponsesThumbnailsThumbnailResponse>());

      const thumbnails: PersonalizedThumbnail[] = homepageThumbnails.map((thumbnail) => {
        const imageAsset = imageAssetByAssetId?.get(thumbnail.assetId);
        return {
          id: thumbnail.homepageThumbnailId,
          assetId: thumbnail.assetId,
          active: thumbnail.personalizedConfigStatus === PersonalizedConfigStatus.Active,
          imageUrl: imageAsset?.imageUrl ?? '',
          moderationStatus: thumbnail.moderationStatus,
          isAssetPending:
            imageAsset?.state === RobloxWebResponsesThumbnailsThumbnailResponseStateEnum.Pending,
          isThumbnailSpammy: thumbnail.homepageThumbnailStatus === HomepageThumbnailStatus.Spammy,
        };
      });
      return {
        thumbnails,
        nextCursor,
      };
    },
    [],
  );

  const maxAssetsPerRequest = 100;
  return useQuery({
    queryKey: getHomepageThumbnailsQueryKey(universeId, cursor),
    queryFn: async () => {
      if (!universeId) {
        return { homepageThumbnails: [], nextCursor: undefined, assets: [] };
      }

      const { homepageThumbnails, nextCursor } = await getHomepageThumbnails(
        universeId,
        cursor,
        200,
      );

      if (homepageThumbnails.length === 0) {
        return { homepageThumbnails, nextCursor, assets: [] };
      }

      const thumbnailClient = getThumbnailsClient();
      // Divide homepageThumbnails into chunks of max 100 per array
      const homepageThumbnailAssetIdsChunks: Array<number[]> = [[]];
      homepageThumbnails.forEach(({ assetId }) => {
        const lastChunk =
          homepageThumbnailAssetIdsChunks[homepageThumbnailAssetIdsChunks.length - 1];
        if (lastChunk.length < maxAssetsPerRequest) {
          lastChunk.push(assetId);
        } else {
          homepageThumbnailAssetIdsChunks.push([assetId]);
        }
      });

      let assets: RobloxWebResponsesThumbnailsThumbnailResponse[] = [];
      try {
        const assetsResponses = homepageThumbnailAssetIdsChunks.map((chunk) =>
          thumbnailClient.getAssets(
            chunk,
            V1AssetsGetReturnPolicyEnum.PlaceHolder,
            // eslint-disable-next-line no-underscore-dangle -- we need to access the value of the enum
            V1AssetsGetSizeEnum._768x432,
            V1AssetsGetFormatEnum.Webp,
            false,
          ),
        );
        assets = (await Promise.all(assetsResponses))
          .flatMap((response) => response.data)
          .filter(Boolean) as RobloxWebResponsesThumbnailsThumbnailResponse[];
      } catch {
        return { homepageThumbnails, nextCursor, assets: [] };
      }

      return { homepageThumbnails, nextCursor, assets };
    },
    retry: 3,
    placeholderData: keepPreviousData, // keep previous data for pagination
    select,
    refetchInterval({ state }) {
      if (!state.data?.homepageThumbnails.length) {
        return false;
      }

      const { thumbnails } = select(state.data);
      for (let index = 0; index < thumbnails.length; index += 1) {
        const thumbnail = thumbnails[index];
        if (thumbnail.moderationStatus === ModerationStatus.Approved && thumbnail.isAssetPending) {
          // It's possible that thumbnail is approved but its asset is still pending during "asset generation" phase
          // see https://roblox.slack.com/archives/CHGEFCAUT/p1729275678566589?thread_ts=1729271791.164929&cid=CHGEFCAUT
          // So the thumbnail image url may not be available yet. In this case, we poll every 2 seconds until the asset is ready
          return 2000; // 2 seconds
        }
        if (thumbnail.moderationStatus === ModerationStatus.Reviewing) {
          // Otherwise if thumbnail is under review, we poll every 5 seconds until the moderation status changes
          return 5000; // 5 seconds
        }
      }

      return false;
    },
    enabled: !!universeId,
  });
};

class PollOperationNotDoneError extends Error {
  public status = 418; // I'm a teapot
}

const usePollOperationForMultipleThumbnailsUploadMutation = (
  universeId: number,
  onSuccess?: () => void,
  onError?: () => void,
  maxPolls = 25, // max retires for polling
  pollInterval = 1000, // default polling interval: 1s
) => {
  const {
    mutate: pollForCompletedOperation,
    mutateAsync: pollForCompletedOperationAsync,
    isPending: isPolling,
    isError: isPollingError,
  } = useMutation({
    mutationFn: async (operationIds: string[]) => {
      const operation = await pollUploadMultipleHomepageThumbnailsStatus(universeId, operationIds);

      if (operation.uploadStatus === UploadStatus.NUMBER_1) {
        throw new PollOperationNotDoneError();
      }

      return operation;
    },
    retry: (failureCount, error) => {
      if (error instanceof PollOperationNotDoneError) {
        return failureCount < maxPolls;
      }
      return false;
    },
    retryDelay: pollInterval,
    onSuccess,
    onError,
    throwOnError: false,
  });

  return useMemo(
    () => ({
      pollForCompletedOperation,
      pollForCompletedOperationAsync,
      isPolling,
      isPollingError,
    }),
    [isPolling, isPollingError, pollForCompletedOperation, pollForCompletedOperationAsync],
  );
};

export const useUploadMultipleHomepageThumbnailsMutation = (
  universeId: number,
  onSuccess?: (thumbnailIds: string[]) => void,
  onError?: (reason: string) => void,
) => {
  const { translate } = useTranslation();
  const { pollForCompletedOperationAsync } =
    usePollOperationForMultipleThumbnailsUploadMutation(universeId);

  const {
    mutate: uploadMultipleThumbnailsForUniverse,
    mutateAsync: uploadMultipleThumbnailsForUniverseAsync,
    isPending: isUploading,
    isError: isUploadingError,
  } = useMutation({
    mutationFn: async (files: File[]) => {
      const { fileToOperationIdDict } = await uploadMultipleHomepageThumbnails(universeId, files);
      const operationIds = Object.values(fileToOperationIdDict);

      const { uploadStatus, uploadThumbnailStatusDict } =
        await pollForCompletedOperationAsync(operationIds);

      if (uploadStatus === UploadStatus.NUMBER_1) {
        throw new PollOperationNotDoneError('upload operation is not done');
      }

      return Array.from(Object.entries(uploadThumbnailStatusDict)).map(
        ([, { homepageThumbnailId, assetId }]) => ({
          assetId,
          homepageThumbnailId,
        }),
      );
    },
    retry: false,
    onSuccess: (data) => {
      const thumbnailIds = data
        .map(({ homepageThumbnailId }) => homepageThumbnailId)
        .filter(Boolean) as string[];
      onSuccess?.(thumbnailIds);
    },
    onError: () => {
      const unknownError = translate('Error.UnknownError' /* CreatorDashboard.Error namespace */);
      onError?.(unknownError);
    },
  });

  return useMemo(
    () => ({
      uploadMultipleThumbnailsForUniverse,
      uploadMultipleThumbnailsForUniverseAsync,
      isUploading,
      isUploadingError,
    }),
    [
      isUploading,
      isUploadingError,
      uploadMultipleThumbnailsForUniverse,
      uploadMultipleThumbnailsForUniverseAsync,
    ],
  );
};

export const findHomepageThumbnailPersonalizationQueryKey = (
  universeId: number,
  active: boolean,
) => {
  return [`${queryKeyPrefix}-findHomepageThumbnailPersonalization`, universeId, active] as const;
};

export const useFindHomepageThumbnailPersonalization = (universeId: number, active: boolean) => {
  return useQuery({
    queryKey: findHomepageThumbnailPersonalizationQueryKey(universeId, active),
    queryFn: async () => {
      return findHomepageThumbnailPersonalizations(universeId, active);
    },
  });
};

export const useDeleteHomepageThumbnailMutation = (
  universeId: number,
  optimisticallyDelete: boolean,
  onSuccess?: (deletedThumbnailIds: string[]) => void,
  onError?: (e: Error, thumbnailIds: string[]) => void,
) => {
  const queryClient = useQueryClient();
  const {
    mutate: deleteHomepageThumbnails,
    mutateAsync: deleteHomepageThumbnailsAsync,
    isPending: isDeleting,
  } = useMutation({
    mutationFn: async (thumbnailIds: string[]) => {
      return deleteHomepageThumbnail(universeId, thumbnailIds);
    },
    onMutate: async (thumbnailIdsToDelete) => {
      if (!optimisticallyDelete) {
        return {};
      }
      await queryClient.cancelQueries({ queryKey: getHomepageThumbnailsQueryKey(universeId) });
      const previousThumbnailData: FindThumbnailsResponse | undefined = queryClient.getQueryData(
        getHomepageThumbnailsQueryKey(universeId),
      );
      queryClient.setQueryData(
        getHomepageThumbnailsQueryKey(universeId),
        (oldData: FindThumbnailsResponse | undefined) => {
          const updatedThumbnails = oldData?.homepageThumbnails.filter(
            (thumbnail) => !thumbnailIdsToDelete.includes(thumbnail.homepageThumbnailId),
          );
          return {
            ...oldData,
            homepageThumbnails: updatedThumbnails ?? [],
          };
        },
      );
      // call onSucess since we are optimistically updating the data
      onSuccess?.(thumbnailIdsToDelete);
      return { previousThumbnailData };
    },
    onSuccess(data, thumbnailIds) {
      onSuccess?.(thumbnailIds);
    },
    onError(e: Error, thumbnailIds: string[], context) {
      if (optimisticallyDelete) {
        queryClient.setQueryData(
          getHomepageThumbnailsQueryKey(universeId),
          context?.previousThumbnailData,
        );
      }
      onError?.(e, thumbnailIds);
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          getHomepageThumbnailsQueryKey(universeId),
          findHomepageThumbnailPersonalizationQueryKey(universeId, true),
        ],
      });
    },
  });

  return useMemo(
    () => ({
      deleteHomepageThumbnails,
      deleteHomepageThumbnailsAsync,
      isDeleting,
    }),
    [deleteHomepageThumbnails, deleteHomepageThumbnailsAsync, isDeleting],
  );
};

export const useCreateHomepageThumbnailPersonalizationMutation = (
  universeId: number,
  optimisticallyCreate: boolean,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  const queryClient = useQueryClient();
  const {
    mutate: resetOrCreateThumbnailPersonalization,
    mutateAsync: createThumbnailPersonalizationAsync,
    isPending: isCreating,
  } = useMutation({
    mutationFn: async (thumbnailIds: string[]) => {
      return createHomepageThumbnailPersonalization(universeId, thumbnailIds);
    },
    onMutate: async (thumbnailIds) => {
      if (!optimisticallyCreate) {
        return {};
      }
      await queryClient.cancelQueries({ queryKey: getHomepageThumbnailsQueryKey(universeId) });
      const previousThumbnailData: FindThumbnailsResponse | undefined = queryClient.getQueryData(
        getHomepageThumbnailsQueryKey(universeId),
      );
      queryClient.setQueryData(
        getHomepageThumbnailsQueryKey(universeId),
        (oldData: FindThumbnailsResponse | undefined) => {
          const updatedThumbnails = oldData?.homepageThumbnails.map((thumbnail) => {
            if (thumbnailIds.includes(thumbnail.homepageThumbnailId)) {
              return { ...thumbnail, personalizedConfigStatus: PersonalizedConfigStatus.Active };
            }
            return thumbnail;
          });
          return {
            ...oldData,
            homepageThumbnails: updatedThumbnails ?? [],
          };
        },
      );
      // call onSucess since we are optimistically updating the data
      onSuccess?.();
      return { previousThumbnailData };
    },
    onSuccess,
    onError(e, thumbnailIds, context) {
      if (optimisticallyCreate) {
        queryClient.setQueryData(
          getHomepageThumbnailsQueryKey(universeId),
          context?.previousThumbnailData,
        );
      }
      onError?.();
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          getHomepageThumbnailsQueryKey(universeId),
          findHomepageThumbnailPersonalizationQueryKey(universeId, true),
        ],
      });
    },
  });

  return useMemo(
    () => ({
      resetOrCreateThumbnailPersonalization,
      createThumbnailPersonalizationAsync,
      isCreating,
    }),
    [resetOrCreateThumbnailPersonalization, createThumbnailPersonalizationAsync, isCreating],
  );
};

export const useUpdateHomepageThumbnailPersonalizationMutation = (
  universeId: number,
  optimisticallyCreate: boolean,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  const queryClient = useQueryClient();
  const {
    mutate: updateThumbnailPersonalization,
    mutateAsync: updateThumbnailPersonalizationAsync,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async ({
      personalizedConfigId,
      thumbnailIds,
    }: {
      personalizedConfigId: string;
      thumbnailIds: string[];
    }) => {
      return updateHomepageThumbnailPersonalization(universeId, personalizedConfigId, thumbnailIds);
    },
    onMutate: async ({ thumbnailIds }) => {
      if (!optimisticallyCreate) {
        return {};
      }
      await queryClient.cancelQueries({ queryKey: getHomepageThumbnailsQueryKey(universeId) });
      const previousThumbnailData: FindThumbnailsResponse | undefined = queryClient.getQueryData(
        getHomepageThumbnailsQueryKey(universeId),
      );
      queryClient.setQueryData(
        getHomepageThumbnailsQueryKey(universeId),
        (oldData: FindThumbnailsResponse | undefined) => {
          const updatedThumbnails = oldData?.homepageThumbnails.map((thumbnail) => {
            if (thumbnailIds.includes(thumbnail.homepageThumbnailId)) {
              return { ...thumbnail, personalizedConfigStatus: PersonalizedConfigStatus.Active };
            }
            return { ...thumbnail, personalizedConfigStatus: PersonalizedConfigStatus.Inactive };
          });
          return {
            ...oldData,
            homepageThumbnails: updatedThumbnails ?? [],
          };
        },
      );
      // call onSucess since we are optimistically updating the data
      onSuccess?.();
      return { previousThumbnailData };
    },
    onSuccess,
    onError(e, thumbnailIds, context) {
      if (optimisticallyCreate) {
        queryClient.setQueryData(
          getHomepageThumbnailsQueryKey(universeId),
          context?.previousThumbnailData,
        );
      }
      onError?.();
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          getHomepageThumbnailsQueryKey(universeId),
          findHomepageThumbnailPersonalizationQueryKey(universeId, true),
        ],
      });
    },
  });

  return useMemo(
    () => ({
      updateThumbnailPersonalization,
      updateThumbnailPersonalizationAsync,
      isUpdating,
    }),
    [updateThumbnailPersonalization, updateThumbnailPersonalizationAsync, isUpdating],
  );
};

import { useCallback } from 'react';
import { skipToken, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import momentsCreationsClient from '@modules/creations/home/clients/momentsCreationsClient';
import { deleteMoment as deleteMomentRequest } from '@modules/creations/home/clients/momentsDeleteClient';
import { publishMoment as publishMomentRequest } from '@modules/creations/home/clients/momentsPublishClient';
import type {
  ListMomentsPageParams,
  ListMomentsPageResponse,
} from '@modules/creations/home/types/MomentCreation';
import type { StoredMomentCreation } from '@modules/creations/home/types/StoredMomentCreation';
import { getMomentVideoFile } from '@modules/creations/home/utils/momentsVideoMediaStorage';

export const getMomentsCreationsQueryKey = (userId?: number) =>
  ['momentsCreations', userId] as const;

export function removeMomentFromMomentsCreationsCache(
  queryClient: QueryClient,
  userId: number,
  momentId: string,
): void {
  queryClient.setQueryData<InfiniteData<ListMomentsPageResponse>>(
    getMomentsCreationsQueryKey(userId),
    (previous) => {
      if (!previous?.pages.length) {
        return previous;
      }

      return {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          moments: page.moments.filter((moment) => moment.id !== momentId),
          moderatedMomentIds: page.moderatedMomentIds.filter((id) => id !== momentId),
          failedMomentIds: page.failedMomentIds.filter((id) => id !== momentId),
        })),
      };
    },
  );
}

export function useMomentsCreations() {
  const { user } = useAuthentication();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: getMomentsCreationsQueryKey(userId),
    queryFn:
      userId != null
        ? ({ pageParam }) => momentsCreationsClient.listMomentsPage(userId, pageParam)
        : skipToken,
    initialPageParam: { pageNumber: 1 } satisfies ListMomentsPageParams,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.paginationContext
        ? {
            paginationContext: lastPage.paginationContext,
            pageNumber: allPages.length + 1,
          }
        : undefined,
    enabled: userId != null,
  });
}

type DeleteMomentVariables = {
  momentId: string;
};

export function useMomentsDelete() {
  const { user } = useAuthentication();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { mutateAsync, isPending, variables } = useMutation({
    mutationFn: ({ momentId }: DeleteMomentVariables) => deleteMomentRequest({ momentId }),
    onSuccess: (_, { momentId }) => {
      if (userId != null) {
        removeMomentFromMomentsCreationsCache(queryClient, userId, momentId);
      }
    },
  });

  const deleteMoment = useCallback((momentId: string) => mutateAsync({ momentId }), [mutateAsync]);

  return {
    deleteMoment,
    deletingMomentId: isPending ? (variables?.momentId ?? null) : null,
    isDeleting: isPending,
  };
}

type PublishMomentVariables = {
  moment: StoredMomentCreation;
};

export function useMomentsPublish() {
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const userId = user?.id;

  const { mutateAsync, isPending, variables } = useMutation({
    mutationFn: async ({ moment }: PublishMomentVariables) => {
      if (userId == null) {
        throw new Error('Authenticated user is required to publish a moment');
      }

      const file = await getMomentVideoFile(userId, moment.id);
      if (!file) {
        throw new Error('Local moment video is required before publishing');
      }

      await publishMomentRequest({
        moment,
        file,
        userId,
        displayName:
          translate('Label.PublishMomentDisplayName' /* TranslationNamespace.Creations */) ||
          'Creator Hub Moment',
      });

      return moment;
    },
  });

  const publishMoment = useCallback(
    (moment: StoredMomentCreation) => mutateAsync({ moment }),
    [mutateAsync],
  );

  return {
    publishMoment,
    publishingMomentId: isPending ? (variables?.moment.id ?? null) : null,
    isPublishing: isPending,
  };
}

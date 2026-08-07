import { useCallback } from 'react';
import { skipToken, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import momentsCreationsClient from '@modules/creations/moments/clients/momentsCreationsClient';
import { deleteMoment as deleteMomentRequest } from '@modules/creations/moments/clients/momentsDeleteClient';
import { publishMoment as publishMomentRequest } from '@modules/creations/moments/clients/momentsPublishClient';
import useMomentsFeedIdEnabled from '@modules/creations/moments/hooks/useMomentsFeedIdEnabled';
import useMomentsUploadLanguageSelectEnabled from '@modules/creations/moments/hooks/useMomentsUploadLanguageSelectEnabled';
import type {
  DraftMomentCreation,
  ListMomentsPageParams,
  ListMomentsPageResponse,
  ServerMomentCreation,
} from '@modules/creations/moments/types/MomentCreation';
import { getMomentRowKey } from '@modules/creations/moments/utils/momentsIdentityUtils';
import { getMomentVideoFile } from '@modules/creations/moments/utils/momentsVideoMediaStorage';

/** Invalidate with this prefix to match both `useFeedItemId` variants, not just one. */
export const getMomentsCreationsQueryKeyPrefix = (userId?: number) =>
  ['momentsCreations', userId] as const;

/**
 * `useFeedItemId` is part of the key on purpose.
 *
 * It is a per-user runtime flag that resolves after first paint, so without it a cache populated on
 * the legacy moment-id path could be read by feed-id-mode code (and vice versa) — the two modes drop
 * different rows and delete through different endpoints. Including it makes a mid-session flip
 * refetch instead of reusing the other mode's data.
 */
export const getMomentsCreationsQueryKey = (userId?: number, useFeedItemId = false) =>
  [...getMomentsCreationsQueryKeyPrefix(userId), useFeedItemId] as const;

export function removeMomentFromMomentsCreationsCache(
  queryClient: QueryClient,
  userId: number,
  momentKey: string,
  useFeedItemId = false,
): void {
  queryClient.setQueryData<InfiniteData<ListMomentsPageResponse>>(
    getMomentsCreationsQueryKey(userId, useFeedItemId),
    (previous) => {
      if (!previous?.pages.length) {
        return previous;
      }

      return {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          moments: page.moments.filter((moment) => getMomentRowKey(moment) !== momentKey),
        })),
      };
    },
  );
}

export function useMomentsCreations() {
  const { user } = useAuthentication();
  const userId = user?.id;
  const useFeedItemId = useMomentsFeedIdEnabled();

  return useInfiniteQuery({
    queryKey: getMomentsCreationsQueryKey(userId, useFeedItemId),
    queryFn:
      userId != null
        ? ({ pageParam }) =>
            momentsCreationsClient.listMomentsPage(userId, pageParam, useFeedItemId)
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
  moment: ServerMomentCreation;
};

export function useMomentsDelete() {
  const { user } = useAuthentication();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const useFeedItemId = useMomentsFeedIdEnabled();

  const { mutateAsync, isPending, variables } = useMutation({
    mutationFn: ({ moment }: DeleteMomentVariables) =>
      deleteMomentRequest({
        momentId: moment.momentId,
        feedItemId: moment.feedItemId,
        useFeedItemId,
      }),
    onSuccess: (_, { moment }) => {
      if (userId != null) {
        removeMomentFromMomentsCreationsCache(
          queryClient,
          userId,
          getMomentRowKey(moment),
          useFeedItemId,
        );
      }
    },
  });

  const deleteMoment = useCallback(
    (moment: ServerMomentCreation) => mutateAsync({ moment }),
    [mutateAsync],
  );

  return {
    deleteMoment,
    deletingMomentKey: isPending && variables != null ? getMomentRowKey(variables.moment) : null,
    isDeleting: isPending,
  };
}

type PublishMomentVariables = {
  moment: DraftMomentCreation;
};

export function useMomentsPublish() {
  const { translate } = useTranslation();
  const { locale: uiLocale } = useLocalization();
  const isLanguageSelectEnabled = useMomentsUploadLanguageSelectEnabled();
  const { user } = useAuthentication();
  const userId = user?.id;

  const { mutateAsync, isPending, variables } = useMutation({
    mutationFn: async ({ moment }: PublishMomentVariables) => {
      if (userId == null) {
        throw new Error('Authenticated user is required to publish a moment');
      }

      const file = await getMomentVideoFile(userId, moment.draftId);
      if (!file) {
        throw new Error('Local moment video is required before publishing');
      }

      await publishMomentRequest({
        moment,
        file,
        userId,
        uiLocale,
        sendVideoContentLanguage: isLanguageSelectEnabled,
        displayName:
          translate('Label.PublishMomentDisplayName' /* TranslationNamespace.Creations */) ||
          'Creator Hub Moment',
      });

      return moment;
    },
  });

  const publishMoment = useCallback(
    (moment: DraftMomentCreation) => mutateAsync({ moment }),
    [mutateAsync],
  );

  return {
    publishMoment,
    publishingDraftId: isPending ? (variables?.moment.draftId ?? null) : null,
    isPublishing: isPending,
  };
}

import {
  skipToken,
  useMutation,
  useQuery,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import type { RoadmapItem } from '@modules/roadMap/v2/types';
import { fetchRoadmapItems, fetchRoadmapLikes, toggleRoadmapLike } from './roadmapRequests';

const DEFAULT_LOCALE = 'en-us';

export const getRoadmapItemsQueryKey = (locale?: string) =>
  locale === undefined ? (['roadmapItems'] as const) : (['roadmapItems', locale] as const);

/**
 * Fetches the roadmap feed (mapped to the UI `RoadmapItem` shape) for the given locale. Backed by
 * GET /v1/roadmap/items on creator-updates-api.
 */
export function useGetRoadmapItems(locale: string = DEFAULT_LOCALE) {
  return useQuery({
    queryKey: getRoadmapItemsQueryKey(locale),
    queryFn: async () => fetchRoadmapItems(locale),
  });
}

export const getRoadmapLikesQueryKey = (userId?: number) => ['roadmapLikes', userId] as const;

/**
 * Fetches the ids of roadmap items the current user has liked. User-scoped and gated on a logged-in
 * user: the request identifies the user by session cookie, so it's meaningless when signed out.
 * Backed by GET /v1/roadmap/likes on creator-updates-api.
 */
export function useGetRoadmapLikes() {
  const { user } = useAuthentication();
  const userId = user?.id;

  return useQuery({
    queryKey: getRoadmapLikesQueryKey(userId),
    queryFn: userId != null ? () => fetchRoadmapLikes() : skipToken,
    enabled: userId != null,
  });
}

type ToggleRoadmapLikeVariables = { itemId: string; nextLiked: boolean };

type ToggleRoadmapLikeContext = {
  previousLikedIds: string[] | undefined;
  previousItems: [QueryKey, RoadmapItem[] | undefined][];
};

type ToggleRoadmapLikeOptions = Omit<
  UseMutationOptions<number | null, Error, ToggleRoadmapLikeVariables, ToggleRoadmapLikeContext>,
  'mutationFn'
>;

/** Rewrites one item's likeCount across every cached roadmap-items query (all locales). */
const writeItemLikeCount = (
  client: QueryClient,
  itemsQueryKey: QueryKey,
  itemId: string,
  nextCount: (likeCount: number) => number,
) =>
  client.setQueriesData<RoadmapItem[]>({ queryKey: itemsQueryKey }, (items) =>
    items?.map((item) =>
      item.id === itemId ? { ...item, likeCount: nextCount(item.likeCount) } : item,
    ),
  );

/**
 * Optimistically likes/unlikes a roadmap item: the heart fills and the count nudges immediately, the
 * server's authoritative count is applied on success, and both caches roll back on failure.
 */
export function useToggleRoadmapLike(options: ToggleRoadmapLikeOptions = {}) {
  const { user } = useAuthentication();
  const likesQueryKey = getRoadmapLikesQueryKey(user?.id);
  const itemsQueryKey = getRoadmapItemsQueryKey();

  return useMutation<number | null, Error, ToggleRoadmapLikeVariables, ToggleRoadmapLikeContext>({
    mutationFn: ({ itemId, nextLiked }) => toggleRoadmapLike(itemId, nextLiked),
    ...options,
    onMutate: async ({ itemId, nextLiked }, context) => {
      await Promise.all([
        context.client.cancelQueries({ queryKey: likesQueryKey }),
        context.client.cancelQueries({ queryKey: itemsQueryKey }),
      ]);

      const previousLikedIds = context.client.getQueryData<string[]>(likesQueryKey);
      const previousItems = context.client.getQueriesData<RoadmapItem[]>({
        queryKey: itemsQueryKey,
      });

      context.client.setQueryData<string[]>(likesQueryKey, (likedIds = []) =>
        nextLiked ? [...likedIds, itemId] : likedIds.filter((id) => id !== itemId),
      );
      writeItemLikeCount(context.client, itemsQueryKey, itemId, (count) =>
        nextLiked ? count + 1 : count - 1,
      );

      return { previousLikedIds, previousItems };
    },
    onError: (error, variables, onMutateResult, context) => {
      if (onMutateResult) {
        context.client.setQueryData(likesQueryKey, onMutateResult.previousLikedIds);
        onMutateResult.previousItems.forEach(([key, items]) =>
          context.client.setQueryData(key, items),
        );
      }
      options.onError?.(error, variables, onMutateResult, context);
    },
    onSuccess: (likeCount, variables, onMutateResult, context) => {
      if (likeCount != null) {
        writeItemLikeCount(context.client, itemsQueryKey, variables.itemId, () => likeCount);
      }
      options.onSuccess?.(likeCount, variables, onMutateResult, context);
    },
  });
}

export default useGetRoadmapItems;

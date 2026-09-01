// Loads group-owned experience revenue share targets via background page drain and normalizes identities and names.
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  SearchCreatorType,
  SearchSortParameter,
  SortOrder,
  Surface,
} from '@rbx/client-universes-api/v1';
import universesClient from '@modules/clients/universes';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { RevShareTargetType, type RevShareTarget } from '../interface/RevShareViewModel';
import { asNumberTypedId } from '../utils/revShareUtils';

const EXPERIENCE_PAGE_SIZE = 100;

export type RevShareExperienceTargetItem = {
  target: RevShareTarget;
  targetName: string;
};

export type RevShareExperienceTargetPage = {
  items: readonly RevShareExperienceTargetItem[];
  hasNextPage: boolean;
};

export const revShareExperienceTargetKey = (managingGroupId: string) =>
  ['revenueShareAgreements', 'targetInventory', 'experiences', managingGroupId] as const;

const EMPTY_ITEMS: RevShareExperienceTargetItem[] = [];

const selectPageItems = (page: RevShareExperienceTargetPage): RevShareExperienceTargetItem[] => [
  ...page.items,
];

export type UseRevShareExperienceTargetsReturn = {
  items: RevShareExperienceTargetItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  refetch: () => void;
};

export function useRevShareExperienceTargets({
  managingGroupId,
  enabled,
}: {
  managingGroupId: string;
  enabled: boolean;
}): UseRevShareExperienceTargetsReturn {
  const flattenItems = useInfiniteFlatMap<
    RevShareExperienceTargetPage,
    RevShareExperienceTargetItem
  >(selectPageItems);
  const isQueryEnabled = enabled && managingGroupId !== '';

  const {
    data: items = EMPTY_ITEMS,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<
    RevShareExperienceTargetPage,
    Error,
    RevShareExperienceTargetItem[],
    ReturnType<typeof revShareExperienceTargetKey>,
    number
  >({
    queryKey: revShareExperienceTargetKey(managingGroupId),
    initialPageParam: 0,
    enabled: isQueryEnabled,
    select: flattenItems,
    queryFn: async ({ pageParam }): Promise<RevShareExperienceTargetPage> => {
      const response = await universesClient.searchUniverses({
        search: undefined,
        creatorType: SearchCreatorType.Group,
        creatorTargetId: asNumberTypedId(managingGroupId),
        isArchived: false,
        isPublic: undefined,
        sortOrder: SortOrder.Desc,
        sortParam: SearchSortParameter.LastUpdated,
        surface: Surface.CreatorHubGroupPayout,
        pageSize: EXPERIENCE_PAGE_SIZE,
        pageIndex: pageParam,
      });

      const itemsForPage = (response.data ?? []).flatMap(
        (universe): RevShareExperienceTargetItem[] => {
          if (universe.id == null) {
            return [];
          }
          const id = String(universe.id);
          return [
            {
              target: { type: RevShareTargetType.Experience, id },
              targetName: universe.name ?? id,
            },
          ];
        },
      );

      return {
        items: itemsForPage,
        hasNextPage: Boolean(response.nextResultIndex),
      };
    },
    getNextPageParam: (page, _pages, lastPageParam) =>
      page.hasNextPage ? lastPageParam + 1 : undefined,
  });

  const fetchNextExperiencesPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage: isQueryEnabled && (hasNextPage ?? false),
    fetchNextPage: fetchNextExperiencesPage,
  });

  const refetchExperiences = useCallback(() => {
    void refetch();
  }, [refetch]);

  return useMemo(
    () => ({
      items,
      isLoading,
      isError,
      hasNextPage: hasNextPage ?? false,
      refetch: refetchExperiences,
    }),
    [items, isLoading, isError, hasNextPage, refetchExperiences],
  );
}

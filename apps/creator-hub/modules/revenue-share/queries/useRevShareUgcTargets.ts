// Loads group-owned UGC revenue share targets across avatar asset types via background page drain and normalizes identities and names.
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import avatarItemTypeConstants from '@modules/creations/avatarItem/constants/avatarItemTypeConstants';
import {
  translateAssetType,
  translateAssetTypeToAsset,
} from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { RevShareTargetType, type RevShareTarget } from '../interface/RevShareViewModel';
import { asNumberTypedId } from '../utils/revShareUtils';

const UGC_TARGET_ASSET_TYPES = avatarItemTypeConstants.avatarAssetTypes;
const UGC_PAGE_SIZE = 30;

type RevShareUgcTargetPageParam = {
  typeIndex: number;
  cursor?: string;
};

const isDecimalString = (id: string | undefined): id is string =>
  id !== undefined && id !== '' && /^\d+$/.test(id);

export type RevShareUgcTargetItem = {
  target: RevShareTarget;
  targetName: string;
};

export type RevShareUgcTargetPage = {
  items: readonly RevShareUgcTargetItem[];
  nextPageParam?: RevShareUgcTargetPageParam;
};

export const revShareUgcTargetKey = (managingGroupId: string) =>
  ['revenueShareAgreements', 'targetInventory', 'ugc', managingGroupId] as const;

const EMPTY_ITEMS: RevShareUgcTargetItem[] = [];

const selectPageItems = (page: RevShareUgcTargetPage): RevShareUgcTargetItem[] => [...page.items];

export type UseRevShareUgcTargetsReturn = {
  items: RevShareUgcTargetItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  refetch: () => void;
};

export function useRevShareUgcTargets({
  managingGroupId,
  enabled,
}: {
  managingGroupId: string;
  enabled: boolean;
}): UseRevShareUgcTargetsReturn {
  const flattenItems = useInfiniteFlatMap<RevShareUgcTargetPage, RevShareUgcTargetItem>(
    selectPageItems,
  );
  const isQueryEnabled = enabled && managingGroupId !== '';

  const {
    data: items = EMPTY_ITEMS,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<
    RevShareUgcTargetPage,
    Error,
    RevShareUgcTargetItem[],
    ReturnType<typeof revShareUgcTargetKey>,
    RevShareUgcTargetPageParam
  >({
    queryKey: revShareUgcTargetKey(managingGroupId),
    initialPageParam: { typeIndex: 0, cursor: undefined },
    enabled: isQueryEnabled,
    select: flattenItems,
    queryFn: async ({ pageParam }): Promise<RevShareUgcTargetPage> => {
      const asset = UGC_TARGET_ASSET_TYPES[pageParam.typeIndex];
      if (asset === undefined) {
        return { items: [], nextPageParam: undefined };
      }

      const response = await itemConfigurationClient.getItemsByCreator(
        UGC_PAGE_SIZE,
        pageParam.cursor,
        asNumberTypedId(managingGroupId),
        undefined,
        translateAssetType(asset),
      );

      const itemsForPage = (response.items ?? []).flatMap((item): RevShareUgcTargetItem[] => {
        const assetDetails = item.marketplaceItemDetails?.assetDetails;
        if (assetDetails?.assetType === undefined || !isDecimalString(item.id)) {
          return [];
        }

        const itemAsset = translateAssetTypeToAsset(assetDetails.assetType);
        if (
          itemAsset === undefined ||
          !avatarItemTypeConstants.avatarAssetTypes.includes(itemAsset)
        ) {
          return [];
        }
        const targetName = item.name?.trim();

        return [
          {
            target: { type: RevShareTargetType.Ugc, id: item.id },
            targetName: targetName === undefined || targetName === '' ? item.id : targetName,
          },
        ];
      });

      const nextCursor = response.nextCursor;
      const normalizedCursor = nextCursor === '' ? undefined : nextCursor;

      let nextPageParam: RevShareUgcTargetPageParam | undefined;
      if (normalizedCursor !== undefined) {
        nextPageParam = { typeIndex: pageParam.typeIndex, cursor: normalizedCursor };
      } else if (pageParam.typeIndex + 1 < UGC_TARGET_ASSET_TYPES.length) {
        nextPageParam = { typeIndex: pageParam.typeIndex + 1, cursor: undefined };
      } else {
        nextPageParam = undefined;
      }

      return {
        items: itemsForPage,
        nextPageParam,
      };
    },
    getNextPageParam: (page) => page.nextPageParam,
  });

  const fetchNextUgcPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage: isQueryEnabled && (hasNextPage ?? false),
    fetchNextPage: fetchNextUgcPage,
  });

  const refetchUgc = useCallback(() => {
    void refetch();
  }, [refetch]);

  return useMemo(
    () => ({
      items,
      isLoading,
      isError,
      error: error instanceof Error ? error : null,
      hasNextPage: hasNextPage ?? false,
      refetch: refetchUgc,
    }),
    [items, isLoading, isError, error, hasNextPage, refetchUgc],
  );
}

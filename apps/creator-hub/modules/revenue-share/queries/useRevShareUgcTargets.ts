// Loads paginated group-owned UGC revenue share targets across supported avatar asset types and normalizes their identities and names.
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import avatarItemTypeConstants from '@modules/creations/avatarItem/constants/avatarItemTypeConstants';
import {
  translateAssetType,
  translateAssetTypeToAsset,
} from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
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

export function useRevShareUgcTargets({
  managingGroupId,
  enabled,
}: {
  managingGroupId: string;
  enabled: boolean;
}) {
  return useInfiniteQuery<
    RevShareUgcTargetPage,
    Error,
    InfiniteData<RevShareUgcTargetPage>,
    ReturnType<typeof revShareUgcTargetKey>,
    RevShareUgcTargetPageParam
  >({
    queryKey: revShareUgcTargetKey(managingGroupId),
    initialPageParam: { typeIndex: 0, cursor: undefined },
    enabled: enabled && managingGroupId !== '',
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

      const items = (response.items ?? []).flatMap((item): RevShareUgcTargetItem[] => {
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
        items,
        nextPageParam,
      };
    },
    getNextPageParam: (page) => page.nextPageParam,
  });
}

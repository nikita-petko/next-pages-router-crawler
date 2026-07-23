import { useQuery } from '@tanstack/react-query';
import {
  RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum,
  RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum,
} from '@rbx/client-catalog/v1';
import {
  RobloxApiDevelopAssetCreatorTypeEnum,
  RobloxApiDevelopAssetModelTypeEnum,
} from '@rbx/client-develop/v1';
import { ClaimContentContentTypeEnum } from '@rbx/client-rights/v1';
import catalogClient from '@modules/clients/catalog';
import developClient from '@modules/clients/develop';
import groupsClient from '@modules/clients/groups';
import usersClient from '@modules/clients/users';

export type CreatorType = 'User' | 'Group';

const bundleCreatorTypeMap = {
  [RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum.NUMBER_0]: undefined,
  [RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum.NUMBER_1]: 'User',
  [RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum.NUMBER_2]: 'Group',
} as const satisfies Record<
  RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum,
  CreatorType | undefined
>;

export type ContentDetails = {
  contentName: string;
  creatorName: string;
  creatorId: string;
  creatorType?: CreatorType;
  isDevMarketplace: boolean;
};

// Place an @ before the name unless the creator is a Group
export function getPrefixedCreatorName(creatorType: string | undefined, creatorName: string) {
  // Some callers use capitalized Group for the type, others use lowercase group
  return creatorType?.toLowerCase() === 'group' ? creatorName : `@${creatorName}`;
}

export const EMPTY_CONTENT_DETAILS: ContentDetails = {
  contentName: '',
  creatorName: '',
  creatorId: '',
  creatorType: undefined,
  isDevMarketplace: false,
};

export const DEV_MARKETPLACE_ASSET_TYPES: ReadonlySet<string> = new Set([
  RobloxApiDevelopAssetModelTypeEnum.Model,
  RobloxApiDevelopAssetModelTypeEnum.Plugin,
  RobloxApiDevelopAssetModelTypeEnum.Audio,
  RobloxApiDevelopAssetModelTypeEnum.FontFace,
  RobloxApiDevelopAssetModelTypeEnum.FontFamily,
  RobloxApiDevelopAssetModelTypeEnum.Decal,
  RobloxApiDevelopAssetModelTypeEnum.MeshPart,
  RobloxApiDevelopAssetModelTypeEnum.Video,
]);

const contentDetailsKey = 'rightsClient/contentDetails';

const getCreatorName = async (
  creatorId: number,
  creatorType: RobloxApiDevelopAssetCreatorTypeEnum,
) => {
  let name = '';
  if (creatorType === RobloxApiDevelopAssetCreatorTypeEnum.Group) {
    const response = await groupsClient.getGroupInfo(creatorId);
    name = response.name || '';
  } else if (creatorType === RobloxApiDevelopAssetCreatorTypeEnum.User) {
    const response = await usersClient.getUserById(creatorId);
    name = response.name || '';
  }
  return name;
};

const bundleDetails = async (itemId: number): Promise<ContentDetails | null> => {
  const response = await catalogClient.postItemDetails([
    {
      itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_2,
      id: itemId,
    },
  ]);
  const bundle = response.data?.[0];
  if (!bundle) {
    return null;
  }
  return {
    contentName: bundle.name || '',
    creatorName: bundle.creatorName || '',
    creatorId: bundle.creatorTargetId?.toString() || '',
    creatorType: bundle.creatorType ? bundleCreatorTypeMap[bundle.creatorType] : undefined,
    isDevMarketplace: false,
  };
};
const assetDetails = async (itemId: number): Promise<ContentDetails | null> => {
  const response = await developClient.getAssetDetails([itemId]);
  const targetId = response.data?.[0]?.creator?.targetId;
  const creatorType = response.data?.[0]?.creator?.type;
  if (!(targetId && creatorType)) {
    return null;
  }
  const creatorName = await getCreatorName(targetId, creatorType);

  const details: ContentDetails = {
    contentName: response.data?.[0]?.name || '',
    creatorName,
    creatorId: targetId.toString(),
    creatorType,
    isDevMarketplace:
      !!response.data?.[0]?.type && DEV_MARKETPLACE_ASSET_TYPES.has(response.data?.[0]?.type),
  };
  return details;
};

export default function useContentDetails(
  itemId: number,
  itemType: ClaimContentContentTypeEnum,
  enabled: boolean = true,
) {
  const response = useQuery({
    queryKey: [contentDetailsKey, itemId, itemType],
    queryFn: async () => {
      if (itemType === ClaimContentContentTypeEnum.Bundle) {
        return bundleDetails(itemId);
      }
      if (itemType === ClaimContentContentTypeEnum.Asset) {
        return assetDetails(itemId);
      }
      return null;
    },
    enabled,
  });
  const isContentFound = response.data != null;

  return {
    contentDetails: response.data || EMPTY_CONTENT_DETAILS,
    isContentFound,
    ...response,
  };
}

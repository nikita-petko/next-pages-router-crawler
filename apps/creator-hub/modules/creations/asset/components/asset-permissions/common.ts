import type { RobloxApiDevelopAssetModel } from '@rbx/client-develop/v1';
import { RobloxApiDevelopAssetCreatorTypeEnum } from '@rbx/client-develop/v1';
import developClient from '@modules/clients/develop';
import groupsClient from '@modules/clients/groups';
import usersClient from '@modules/clients/users';
import type Asset from '@modules/miscellaneous/common/enums/Asset';
import type { TAssetDetails } from './types';
import { PrivateAssetTypes } from './types';

export const ASSET_HEADER = 'Label.Asset';
export const OWNER_HEADER = 'Label.Owner';
export const ID_HEADER = 'Label.Id';
export const ASSET_TYPE_HEADER = 'Label.AssetType';
export const MAX_PAGE_SIZE = 50;

const userNameCache: { [id: number]: string } = {};
const groupNameCache: { [id: number]: string } = {};

const populateCreatorNames = async (results: RobloxApiDevelopAssetModel[]) => {
  if (results.length === 0) {
    return;
  }

  try {
    const usersList: number[] = [];
    const groupsList: number[] = [];
    results.forEach((result) => {
      if (result.creator && result.creator.targetId) {
        if (
          result.creator?.type === RobloxApiDevelopAssetCreatorTypeEnum.User &&
          !userNameCache[result.creator.targetId]
        ) {
          usersList.push(result.creator.targetId);
        } else if (
          result.creator?.type === RobloxApiDevelopAssetCreatorTypeEnum.Group &&
          !groupNameCache[result.creator.targetId]
        ) {
          groupsList.push(result.creator.targetId);
        }
      }
    });

    if (usersList.length > 0) {
      const creatorInfo = await usersClient.getUsersByIds(usersList);
      creatorInfo.data?.forEach((a) => {
        if (a.id && a.name) {
          userNameCache[a.id] = a.name;
        }
      });
    }

    if (groupsList.length > 0) {
      const groupsInfo = await groupsClient.getGroupsInfo(groupsList);
      groupsInfo.data?.forEach((a) => {
        if (a.id && a.name) {
          groupNameCache[a.id] = a.name;
        }
      });
    }
  } catch {
    // It's ok to continue.
  }
};

const getAssetDetails = async (
  assetIds: number[],
): Promise<[Map<number, TAssetDetails>, Set<number>, Map<number, TAssetDetails>]> => {
  const resultMap = new Map<number, TAssetDetails>();
  const missingAssetDetailsMap = new Map<number, TAssetDetails>();

  const response = await developClient.getAssetDetails(assetIds);
  const data = response.data ?? [];
  await populateCreatorNames(data);

  data.forEach((result) => {
    if (PrivateAssetTypes.has(result.type as string as Asset)) {
      let creatorName = '';
      if (
        result.creator?.targetId &&
        result.creator?.type === RobloxApiDevelopAssetCreatorTypeEnum.User &&
        userNameCache[result.creator.targetId]
      ) {
        creatorName = userNameCache[result.creator.targetId];
      } else if (
        result.creator?.targetId &&
        result.creator?.type === RobloxApiDevelopAssetCreatorTypeEnum.Group &&
        groupNameCache[result.creator.targetId]
      ) {
        creatorName = groupNameCache[result.creator.targetId];
      }
      resultMap.set(result.id as number, {
        assetId: result.id as number,
        name: result.name as string,
        assetType: result.type as string as Asset,
        creatorName,
      });
    }
  });

  // Invalid asset types.
  const invalidAssetTypeIdsSet = new Set<number>();
  response.data
    ?.filter((a) => !PrivateAssetTypes.has(a.type as string as Asset))
    .map((a) => invalidAssetTypeIdsSet.add(a.id as number));

  // Missing asset details.
  assetIds.forEach((id) => {
    if (!resultMap.has(id) && !invalidAssetTypeIdsSet.has(id)) {
      missingAssetDetailsMap.set(id, {
        assetId: id,
        name: '',
        assetType: null,
        creatorName: '',
      });
    }
  });

  return [resultMap, invalidAssetTypeIdsSet, missingAssetDetailsMap];
};

export default getAssetDetails;

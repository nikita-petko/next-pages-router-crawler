import {
  DataSharingLicenseType,
  ResourceSettingsClient,
  developClient,
  UniverseResponse,
  AssetConfiguration,
  UniverseConfiguration,
  toolboxClient,
  CategoryType,
  BundleConfiguration,
  ToolboxItemDetails,
} from '@modules/clients';
import { getResponseFromError } from '@modules/clients/utils';
import { Asset, utils } from '@modules/miscellaneous/common';
import { V1UserUniversesGetLimitEnum, V1UserUniversesGetSortOrderEnum } from '@rbx/clients/develop';

const { arrayToChunks } = utils;
const { universeApi } = ResourceSettingsClient;
type TGroupsMembership = {
  group: {
    id: number;
    name: string;
    memberCount: number;
    hasVerifiedBadge: boolean;
  };
  role: {
    id: number;
    name: string;
    rank: number;
  };
};

export const getAllOwnedGroups = async (userId: number) => {
  const res = await fetch(
    `https://groups.${process.env.bedev1BaseDomain}/v2/users/${userId}/groups/roles`,
    {
      credentials: 'include',
    },
  );
  const { data } = (await res.json()) as {
    data: TGroupsMembership[];
  };
  const parsedData = data.filter((group) => group.role.rank === 255).map((group) => group.group);
  return parsedData as TGroupsMembership['group'][];
};

export const getGroupExperiences = async (
  groupId: number,
  cursor?: string,
): Promise<UniverseResponse[]> => {
  const { data = [], nextPageCursor } = await developClient.getGroupUniverses(
    groupId,
    undefined,
    undefined,
    undefined,
    cursor,
  );
  if (nextPageCursor !== undefined) {
    const response = await getGroupExperiences(groupId, nextPageCursor);
    return [...data, ...response].filter((experience) => experience.privacyType !== 'Private');
  }
  return [...data].filter((experience) => experience.privacyType !== 'Private');
};

export const getUserExperiences = async (cursor?: string): Promise<UniverseResponse[]> => {
  const { data = [], nextPageCursor } = await developClient.getUserUniverses(
    undefined,
    undefined,
    undefined,
    cursor,
  );
  if (nextPageCursor !== undefined) {
    const response = await getUserExperiences(nextPageCursor);
    return [...data, ...response].filter((experience) => experience.privacyType !== 'Private');
  }

  return [...data].filter((experience) => experience.privacyType !== 'Private');
};

export const getExperiences = async (groupIds: number[]): Promise<UniverseResponse[]> => {
  const response = await Promise.all([
    ...groupIds.map((groupId) => getGroupExperiences(groupId)),
    getUserExperiences(),
  ]);
  return response.flat();
};

export const getUserExperiencesV2 = async (
  sortDir: V1UserUniversesGetSortOrderEnum,
  pageSize: V1UserUniversesGetLimitEnum,
  cursor?: string,
): Promise<{ data: UniverseResponse[]; nextPageCursor: string | undefined }> => {
  const { data = [], nextPageCursor } = await developClient.getUserUniverses(
    undefined,
    sortDir,
    pageSize,
    cursor,
  );
  return {
    data,
    nextPageCursor,
  };
};

export const getGroupExperiencesV2 = async (
  groupId: number,
  sortDir: V1UserUniversesGetSortOrderEnum,
  pageSize: V1UserUniversesGetLimitEnum,
  cursor?: string,
): Promise<{ data: UniverseResponse[]; nextPageCursor?: string }> => {
  const { data = [], nextPageCursor } = await developClient.getGroupUniverses(
    groupId,
    undefined,
    sortDir,
    pageSize,
    cursor,
  );
  return {
    data,
    nextPageCursor,
  };
};

export const getUniverseConfigurations = async (
  universeIds: number[],
): Promise<UniverseConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(universeIds, 100).map((ids) =>
    universeApi.universeBatchGetUniverseConfigurations({ universeIds: ids }),
  );
  const response = await Promise.all([...batchGetConfigurations]);
  const parsedResponses = response.flat().reduce<UniverseConfiguration[]>((acc, curr) => {
    return [...acc, ...curr.configurations];
  }, []);
  return parsedResponses;
};

export const setUniverseConfigurations = async (
  configurations: Record<number, Set<DataSharingLicenseType>>,
) => {
  const parsedConfigurations: UniverseConfiguration[] = Object.keys(configurations).map(
    (universeId) => ({
      universeId: Number(universeId),
      dataSharingLicenseTypes: Array.from(configurations[Number(universeId)].values()),
      updatedUtc: new Date(),
    }),
  );
  const batchParsedConfigurations = arrayToChunks(parsedConfigurations, 50).map((configs) =>
    ResourceSettingsClient.universeApi.universeBatchSetUniverseConfigurations({
      universeBatchSetUniverseConfigurationsRequest: {
        configurations: configs,
      },
    }),
  );
  await Promise.all([...batchParsedConfigurations]);
};

const assetTypeToCategoryType: { [key: string]: CategoryType } = {
  [Asset.Model]: CategoryType.Model,
};

export const getUserCreatedPricedMarketplaceAssetIds = async (
  userId: number,
  assetType: Asset,
  pageSize: number,
  keyword?: string,
  cursor?: string,
): Promise<{ assetIds: Array<number>; nextPageCursor?: string }> => {
  const { data, nextPageCursor } = await toolboxClient.getMarketplaceAssets({
    assetType: assetTypeToCategoryType[assetType],
    minPriceInCents: 1,
    limit: pageSize,
    creatorTargetId: userId,
    creatorType: 1,
    keyword,
    cursor,
    includeAllPublishedAssets: true,
  });

  let assetIds: number[] = [];
  if (data !== null && data !== undefined) {
    assetIds = data
      .map((item: { id?: number }) => item.id)
      .filter((id: number | undefined): id is number => {
        return id !== undefined;
      });
  }
  return {
    assetIds,
    nextPageCursor: nextPageCursor ?? undefined,
  };
};

export const getMarketplaceItemDetails = async (
  assetIds: Array<number>,
): Promise<Array<ToolboxItemDetails>> => {
  if (assetIds.length === 0) {
    return [];
  }
  const response = await toolboxClient.getItemDetails(assetIds);
  return response.items;
};

export const getAssetConfigurationBestEffort = async (
  assetId: number,
): Promise<AssetConfiguration | null> => {
  try {
    const response = await ResourceSettingsClient.assetApi.assetGetAssetConfiguration({
      assetId,
    });
    // eslint-disable-next-line no-underscore-dangle -- Underscore comes from the generated client, can't be changed here
    return response._configuration;
  } catch (err) {
    const response = getResponseFromError(err);
    if (response?.status === 404 || response?.status === 403) {
      return null;
    }
    throw err;
  }
};

export const getAssetConfigurations = async (assetIds: number[]): Promise<AssetConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(assetIds, 100).map((ids) =>
    ResourceSettingsClient.assetApi.assetBatchGetAssetConfigurations({ assetIds: ids }),
  );
  const response = await Promise.all([...batchGetConfigurations]);
  const parsedResponses = response.flat().reduce<AssetConfiguration[]>((acc, curr) => {
    return [...acc, ...curr.configurations];
  }, []);
  return parsedResponses;
};

export const setAssetConfigurations = async (
  configurations: Record<number, Set<DataSharingLicenseType>>,
) => {
  const parsedConfigurations: AssetConfiguration[] = Object.keys(configurations).map((assetId) => ({
    assetId: Number(assetId),
    dataSharingLicenseTypes: Array.from(configurations[Number(assetId)].values()),
    updatedUtc: new Date(),
  }));

  const batchSetAssetConfigurations = arrayToChunks(parsedConfigurations, 50).map((configs) =>
    ResourceSettingsClient.assetApi.assetBatchSetAssetConfigurations({
      assetBatchSetAssetConfigurationsRequest: {
        configurations: configs,
      },
    }),
  );
  await Promise.all([...batchSetAssetConfigurations]);
};

export const getBundleConfigurations = async (
  bundleIds: number[],
): Promise<BundleConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(bundleIds, 100).map((ids) => {
    return ResourceSettingsClient.bundleApi.bundleBatchGetBundleConfigurations({ bundleIds: ids });
  });
  const response = await Promise.all([...batchGetConfigurations]);
  const parsedResponses = response.flat().reduce<BundleConfiguration[]>((acc, curr) => {
    return [...acc, ...curr.configurations];
  }, []);
  return parsedResponses;
};

export const setBundleConfigurations = async (
  configurations: Record<number, Set<DataSharingLicenseType>>,
) => {
  const parsedConfigurations: BundleConfiguration[] = Object.keys(configurations).map(
    (bundleId) => ({
      bundleId: Number(bundleId),
      dataSharingLicenseTypes: Array.from(configurations[Number(bundleId)].values()),
      updatedUtc: new Date(),
    }),
  );
  const batchSetBundleConfigurations = arrayToChunks(parsedConfigurations, 50).map((configs) =>
    ResourceSettingsClient.bundleApi.bundleBatchSetBundleConfigurations({
      bundleBatchSetBundleConfigurationsRequest: {
        configurations: configs,
      },
    }),
  );
  await Promise.all([...batchSetBundleConfigurations]);
};

export const getAvatarAssetConfigurations = async (
  assetIds: number[],
): Promise<AssetConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(assetIds, 100).map((ids) => {
    return ResourceSettingsClient.assetApi.assetBatchGetAvatarAssetConfigurations({
      assetIds: ids,
    });
  });
  const response = await Promise.all([...batchGetConfigurations]);
  const parsedResponses = response.flat().reduce<AssetConfiguration[]>((acc, curr) => {
    return [...acc, ...curr.configurations];
  }, []);
  return parsedResponses;
};

export const setAvatarAssetConfigurations = async (
  configurations: Record<number, Set<DataSharingLicenseType>>,
) => {
  const parsedConfigurations: AssetConfiguration[] = Object.keys(configurations).map((assetId) => ({
    assetId: Number(assetId),
    dataSharingLicenseTypes: Array.from(configurations[Number(assetId)].values()),
    updatedUtc: new Date(),
  }));
  const batchSetAvatarAssetConfigurations = arrayToChunks(parsedConfigurations, 50).map((configs) =>
    ResourceSettingsClient.assetApi.assetBatchSetAvatarAssetConfigurations({
      assetBatchSetAssetConfigurationsRequest: {
        configurations: configs,
      },
    }),
  );
  await Promise.all([...batchSetAvatarAssetConfigurations]);
};

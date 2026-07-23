/* oxlint-disable oxc/no-accumulating-spread -- pre-existing pattern in this file; batch-get reducers were authored as array spreads here. */
/* oxlint-disable typescript-eslint/no-unsafe-type-assertion -- pre-existing pattern in this file; JSON responses are validated upstream by the develop client. */
import type {
  V1UserUniversesGetLimitEnum,
  V1UserUniversesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import developClient, { type UniverseResponse } from '@modules/clients/develop';
import type {
  DataSharingLicenseType,
  AssetConfiguration,
  UniverseConfiguration,
  BundleConfiguration,
} from '@modules/clients/resourceSettings';
import { ResourceSettingsClient } from '@modules/clients/resourceSettings';
import toolboxClient, {
  CategoryType,
  type ToolboxItemDetails,
} from '@modules/clients/toolboxService';
import { getResponseFromError } from '@modules/clients/utils';
import { hasPlayableAudience } from '@modules/creations/common/audiences';
import { Asset } from '@modules/miscellaneous/common';
import { arrayToChunks } from '@modules/miscellaneous/utils';

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
  return parsedData;
};

const isExperienceNotPrivate = (
  experience: UniverseResponse,
  enableAudiencesReplacement: boolean,
): boolean => {
  if (enableAudiencesReplacement) {
    return hasPlayableAudience(experience.audiences);
  }
  return experience.privacyType !== 'Private';
};

export const getGroupExperiences = async (
  groupId: number,
  cursor?: string,
  enableAudiencesReplacement = false,
): Promise<UniverseResponse[]> => {
  const { data = [], nextPageCursor } = await developClient.getGroupUniverses(
    groupId,
    undefined,
    undefined,
    undefined,
    cursor,
  );
  if (nextPageCursor !== undefined) {
    const response = await getGroupExperiences(groupId, nextPageCursor, enableAudiencesReplacement);
    return [...data, ...response].filter((experience) =>
      isExperienceNotPrivate(experience, enableAudiencesReplacement),
    );
  }
  return [...data].filter((experience) =>
    isExperienceNotPrivate(experience, enableAudiencesReplacement),
  );
};

export const getUserExperiences = async (
  cursor?: string,
  enableAudiencesReplacement = false,
): Promise<UniverseResponse[]> => {
  const { data = [], nextPageCursor } = await developClient.getUserUniverses(
    undefined,
    undefined,
    undefined,
    cursor,
  );
  if (nextPageCursor !== undefined) {
    const response = await getUserExperiences(nextPageCursor, enableAudiencesReplacement);
    return [...data, ...response].filter((experience) =>
      isExperienceNotPrivate(experience, enableAudiencesReplacement),
    );
  }

  return [...data].filter((experience) =>
    isExperienceNotPrivate(experience, enableAudiencesReplacement),
  );
};

export const getExperiences = async (
  groupIds: number[],
  enableAudiencesReplacement = false,
): Promise<UniverseResponse[]> => {
  const response = await Promise.all([
    ...groupIds.map((groupId) =>
      getGroupExperiences(groupId, undefined, enableAudiencesReplacement),
    ),
    getUserExperiences(undefined, enableAudiencesReplacement),
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
  const response = await Promise.all(batchGetConfigurations);
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
  await Promise.all(batchParsedConfigurations);
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
  const response = await Promise.all(batchGetConfigurations);
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
  await Promise.all(batchSetAssetConfigurations);
};

export const getBundleConfigurations = async (
  bundleIds: number[],
): Promise<BundleConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(bundleIds, 100).map((ids) => {
    return ResourceSettingsClient.bundleApi.bundleBatchGetBundleConfigurations({ bundleIds: ids });
  });
  const response = await Promise.all(batchGetConfigurations);
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
  await Promise.all(batchSetBundleConfigurations);
};

export const getAvatarAssetConfigurations = async (
  assetIds: number[],
): Promise<AssetConfiguration[]> => {
  const batchGetConfigurations = arrayToChunks(assetIds, 100).map((ids) => {
    return ResourceSettingsClient.assetApi.assetBatchGetAvatarAssetConfigurations({
      assetIds: ids,
    });
  });
  const response = await Promise.all(batchGetConfigurations);
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
  await Promise.all(batchSetAvatarAssetConfigurations);
};

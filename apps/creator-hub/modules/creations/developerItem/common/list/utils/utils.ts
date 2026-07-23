import type {
  RobloxApiDevelopAssetModel,
  RobloxApiDevelopModelsUniverseModel,
} from '@rbx/client-develop/v1';
import type { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import developClient from '@modules/clients/develop';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import toolboxClient, { assetTypeIdToAssetType } from '@modules/clients/toolboxService';
import { Asset } from '@modules/miscellaneous/common';
import type { TModelListItem } from '../../../models/types';
import type { TCreatorStoreListItem } from '../../types';

function loadAssetDetailFactory<T>(
  dataReducer: (previousValue: T[], item: RobloxApiDevelopAssetModel, index: number) => T[],
  assetDetailMaxCountPerRequest = 50,
) {
  async function loadAssetDetail(assetIds: number[]) {
    const detailResponse = await developClient.getAssetDetails(assetIds);
    if (!detailResponse.data) {
      throw new Error('Asset detail endpoint returns no data');
    }
    return detailResponse.data.reduce<T[]>(dataReducer, []);
  }
  return async (assetIds: number[]) => {
    if (assetIds.length <= assetDetailMaxCountPerRequest) {
      return loadAssetDetail(assetIds);
    }
    const currentAssetIds = [...assetIds];
    const promises = [];
    do {
      promises.push(loadAssetDetail(currentAssetIds.splice(0, assetDetailMaxCountPerRequest)));
    } while (currentAssetIds.length > 0);
    const results = await Promise.all(promises);
    return results.reduce<T[]>((previousValue, currentValue) => {
      return [...previousValue, ...currentValue];
    }, []);
  };
}

function loadAssetFactory<T>(detailFetchFunc: (assetIds: number[]) => Promise<T[]>) {
  return async (
    assetType: string,
    isArchived?: boolean,
    groupId?: number,
    limit?: V1CreationsGetAssetsGetLimitEnum,
    cursor?: string,
  ): Promise<{ nextPageCursor?: string; items: T[] }> => {
    const { nextPageCursor, data: creationData } = await itemconfigurationClient.getCreations(
      assetType,
      isArchived,
      groupId,
      limit,
      cursor,
    );
    if (typeof creationData === 'undefined') {
      throw new TypeError('Endpoint returns no data');
    }
    const assetIds = creationData.reduce<number[]>((previousValue: number[], currentValue) => {
      if (typeof currentValue.assetId === 'undefined') {
        return previousValue;
      }
      return [...previousValue, currentValue.assetId];
    }, []);
    if (assetIds.length === 0) {
      return {
        items: [],
      };
    }

    return {
      nextPageCursor: nextPageCursor || undefined,
      items: await detailFetchFunc(assetIds),
    };
  };
}

function loadModelFactoryFromToolbox<T>(detailFetchFunc: (assetIds: number[]) => Promise<T[]>) {
  return async (
    userId: number,
    assetType: string,
    groupId?: number,
    limit?: V1CreationsGetAssetsGetLimitEnum,
    cursor?: string,
    separateModelsAndPackages: boolean = false, // whether to exclude packages
    includeSharedAssets: boolean = false, // whether to show assets shared with group
  ): Promise<{ nextPageCursor?: string; items: T[] }> => {
    const { nextPageCursor, data: creationData } = await toolboxClient.getCreations(
      userId,
      assetType,
      groupId,
      limit,
      cursor,
      separateModelsAndPackages,
      includeSharedAssets,
    );
    if (creationData == null) {
      throw new Error('Failed to Fetch Developer Items');
    }
    const assetIds = creationData.reduce<number[]>((previousValue: number[], currentValue) => {
      if (currentValue?.id == null) {
        return previousValue;
      }
      return [...previousValue, currentValue.id];
    }, []);
    if (assetIds.length === 0) {
      return {
        items: [],
      };
    }

    return {
      nextPageCursor: nextPageCursor || undefined,
      items: await detailFetchFunc(assetIds),
    };
  };
}

async function loadModelsDetailsFromToolbox(assetIds: number[]) {
  const { items } = await toolboxClient.getItemDetails(assetIds);

  const creatingUniverseIds = items.reduce<number[]>((previousValue: number[], currentValue) => {
    const { asset } = currentValue;
    if (!asset || asset.creatingUniverseId == null) {
      return previousValue;
    }
    return [...previousValue, asset.creatingUniverseId];
  }, []);

  const { data: creatingUniverses } = await developClient.getUniversesDetails(creatingUniverseIds);

  return items.reduce<TModelListItem[]>((previousValue, item) => {
    const { asset, product } = item;
    if (
      !asset ||
      typeof asset.createdUtc === 'undefined' ||
      typeof asset.id === 'undefined' ||
      asset.name == null
    ) {
      return previousValue;
    }
    let creatingUniverse;
    if (asset.creatingUniverseId) {
      creatingUniverse = creatingUniverses?.find(
        (universe) => universe.id === asset.creatingUniverseId,
      );
    }
    return [
      ...previousValue,
      {
        assetId: asset.id,
        assetType: Asset.Model,
        created: asset.createdUtc || null,
        isOnMarketplace: (product && product.isForSaleOrIsPublicDomain) || false,
        name: asset.name,
        assetSubTypes: asset.assetSubTypes || [],
        creatingUniverseId: asset.creatingUniverseId || undefined,
        creatingUniverseName: creatingUniverse?.name,
      },
    ];
  }, []);
}

function loadAssetFactoryFromToolbox(
  detailFetchFunc: (
    assetIds: number[],
    fetchUniverseAttributionDetails: boolean,
  ) => Promise<TCreatorStoreListItem[]>,
  fetchUniverseAttributionDetails: boolean,
) {
  return async (
    userId: number,
    assetType: string,
    groupId?: number,
    limit?: number,
    cursor?: string,
  ): Promise<{ nextPageCursor?: string; items: TCreatorStoreListItem[] }> => {
    const { nextPageCursor, data: creationData } = await toolboxClient.getCreations(
      userId,
      assetType,
      groupId,
      limit,
      cursor,
    );
    if (!creationData) {
      throw new Error(
        `Failed to fetch Toolbox creations for user: ${userId} or group: ${groupId} and assetType: ${assetType}`,
      );
    }
    const assetIds = creationData.reduce<number[]>((previousValue: number[], currentValue) => {
      if (!currentValue?.id) {
        return previousValue;
      }
      return [...previousValue, currentValue.id];
    }, []);
    if (assetIds.length === 0) {
      return {
        items: [],
      };
    }

    return {
      nextPageCursor: nextPageCursor || undefined,
      items: await detailFetchFunc(assetIds, fetchUniverseAttributionDetails),
    };
  };
}
async function loadAssetsDetailsFromToolbox(
  assetIds: number[],
  fetchUniverseAttributionDetails: boolean,
) {
  const { items } = await toolboxClient.getItemDetails(assetIds);

  let creatingUniverses: Array<RobloxApiDevelopModelsUniverseModel> | undefined;
  if (fetchUniverseAttributionDetails) {
    const creatingUniverseIds = items.reduce<number[]>((previousValue: number[], currentValue) => {
      const { asset } = currentValue;
      if (!asset || asset.creatingUniverseId == null) {
        return previousValue;
      }
      return [...previousValue, asset.creatingUniverseId];
    }, []);

    const { data } = await developClient.getUniversesDetails(creatingUniverseIds);
    creatingUniverses = data;
  }

  return items.flatMap((item) => {
    const { asset, fiatProduct } = item;
    if (
      !asset ||
      typeof asset.createdUtc === 'undefined' ||
      typeof asset.id === 'undefined' ||
      asset.name == null
    ) {
      return [];
    }
    let creatingUniverse;
    if (asset.creatingUniverseId) {
      creatingUniverse = creatingUniverses?.find(
        (universe) => universe.id === asset.creatingUniverseId,
      );
    }
    return [
      {
        assetId: asset.id,
        assetType: assetTypeIdToAssetType[asset.typeId || 10],
        created: asset.createdUtc || null,
        isOnMarketplace: fiatProduct?.purchasable === true,
        name: asset.name,
        assetSubTypes: asset.assetSubTypes || [],
        creatingUniverseId: asset.creatingUniverseId || undefined,
        creatingUniverseName: creatingUniverse?.name,
      },
    ];
  });
}

function loadDevItemFunctionDefaultFactory<T>(
  dataReducer: (previousValue: T[], item: RobloxApiDevelopAssetModel, index: number) => T[],
) {
  return loadAssetFactory(loadAssetDetailFactory(dataReducer));
}

export default {
  loadAssetFactory,
  loadAssetFactoryFromToolbox,
  loadModelFactoryFromToolbox,
  loadAssetsDetailsFromToolbox,
  loadModelsDetailsFromToolbox,
  loadAssetDetailFactory,
  loadDevItemFunctionDefaultFactory,
};

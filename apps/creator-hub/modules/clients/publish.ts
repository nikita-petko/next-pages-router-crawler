import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  BadgesApi,
  GameThumbnailsApi,
  GameIconApi,
  V1GamesGameIdIconPostRequest,
  V1BadgesBadgeIdIconPostRequest,
  V1AssetsAssetIdMediaGetRequest,
  V1AssetsAssetIdMediaPostRequest,
  V1AssetsAssetIdMediaMediaAssetIdDeleteRequest,
  V1AssetsAssetIdMediaOrderPostRequest,
  RobloxWebWebAPIModelsApiArrayResponseSystemInt64,
  RobloxPublishApiUploadResponse,
  V1GamesGameIdThumbnailImagePostRequest,
  AssetQuotasApi,
  AssetThumbnailsApi,
  PluginApi,
  RobloxPublishApiAssetQuotasResponse,
} from '@rbx/clients/publish';
import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import { getBEDEV1ServiceBasePath } from './utils';
import tryParseResponseError from './utils/tryParseResponseError';

const basePath = getBEDEV1ServiceBasePath('publish');

export type PatchIconResponse = RobloxPublishApiUploadResponse;
export type PostThumbnailResponse = RobloxPublishApiUploadResponse;
export type GetAssetMediaResponse = RobloxWebWebAPIModelsApiArrayResponseSystemInt64;
export type PostAssetMediaResponse = RobloxPublishApiUploadResponse;
export enum QuotaDuration {
  Month = 'Month',
}
export const QuotaDurationToDaysCount: { [key in QuotaDuration]: string } = {
  [QuotaDuration.Month]: '30',
};
export type DeveloperItemDistributionQuota = {
  capacity: number;
  duration: QuotaDuration;
  expirationTime?: Date;
  usage: number;
};

const defaultConfiguration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

// implement patch request interface for badge icon updates
const badgesApi = new BadgesApi(defaultConfiguration);
const gameThumbnailsApi = new GameThumbnailsApi(defaultConfiguration);
const universeIconApi = new GameIconApi(defaultConfiguration);
const assetQuotasApi = new AssetQuotasApi(defaultConfiguration);
const pluginApi = new PluginApi(defaultConfiguration);
const assetThumbnailsApi = new AssetThumbnailsApi(defaultConfiguration);

export interface PublishIconClient {
  patchBadgeIcon(badgeId: number, requestFiles: Blob): Promise<PatchIconResponse>;
  patchPluginIcon(pluginId: number, requestFiles: Blob): Promise<RobloxPublishApiUploadResponse>;
  uploadThumbnailImage(universeId: number, file: File): Promise<PostThumbnailResponse>;
  getAssetMedia(assetId: number): Promise<GetAssetMediaResponse>;
  postAssetMedia(assetId: number, file: File): Promise<PostAssetMediaResponse>;
  postOrderAssetMedia(assetId: number, mediaAssetIds: Array<number>): Promise<void>;
  deleteAssetMedia(assetId: number, mediaAssetId: number): Promise<void>;
  patchUniverseIcon(universeId: number, requestFiles: Blob): Promise<PatchIconResponse>;
  getAssetQuotas(
    resourceType: string,
    assetType: string,
  ): Promise<RobloxPublishApiAssetQuotasResponse>;
}

const publishIconClient: PublishIconClient = {
  async patchBadgeIcon(badgeId: number, requestFiles: Blob) {
    const request: V1BadgesBadgeIdIconPostRequest = {
      badgeId,
      requestFiles,
    };
    try {
      const res = await badgesApi.v1BadgesBadgeIdIconPost(request);
      return res;
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async patchPluginIcon(pluginId: number, requestFiles: Blob) {
    try {
      return await pluginApi.v1PluginsPluginIdIconPost({
        pluginId,
        requestFiles,
      });
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async uploadThumbnailImage(universeId: number, file: File) {
    const request: V1GamesGameIdThumbnailImagePostRequest = {
      gameId: universeId,
      requestFiles: file,
    };
    return gameThumbnailsApi.v1GamesGameIdThumbnailImagePost(request);
  },
  async patchUniverseIcon(universeId: number, requestFiles: Blob) {
    const request: V1GamesGameIdIconPostRequest = {
      gameId: universeId,
      requestFiles,
    };
    try {
      return await universeIconApi.v1GamesGameIdIconPost(request);
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async getAssetQuotas(
    resourceType: string,
    assetType: string,
  ): Promise<RobloxPublishApiAssetQuotasResponse> {
    try {
      return await assetQuotasApi.v1AssetQuotasGet({ resourceType, assetType });
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async getAssetMedia(assetId: number) {
    const request: V1AssetsAssetIdMediaGetRequest = {
      assetId,
    };
    try {
      return await assetThumbnailsApi.v1AssetsAssetIdMediaGet(request);
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async postAssetMedia(assetId: number, file: File) {
    const request: V1AssetsAssetIdMediaPostRequest = {
      assetId,
      requestFiles: file,
    };
    try {
      return await assetThumbnailsApi.v1AssetsAssetIdMediaPost(request);
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async deleteAssetMedia(assetId: number, mediaAssetId: number) {
    const request: V1AssetsAssetIdMediaMediaAssetIdDeleteRequest = {
      assetId,
      mediaAssetId,
    };
    try {
      await assetThumbnailsApi.v1AssetsAssetIdMediaMediaAssetIdDelete(request);
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
  async postOrderAssetMedia(assetId: number, mediaAssetIds: number[]) {
    const request: V1AssetsAssetIdMediaOrderPostRequest = {
      assetId,
      mediaAssetIds,
    };
    try {
      await assetThumbnailsApi.v1AssetsAssetIdMediaOrderPost(request);
    } catch (e) {
      const publishError = await tryParseResponseError(e);
      if (publishError) {
        throw new GenericBEDEV1Error(publishError.code, publishError.message);
      } else {
        throw e;
      }
    }
  },
};

export default publishIconClient;

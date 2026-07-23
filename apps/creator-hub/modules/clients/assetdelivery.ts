/** Auto generated API client entry file for thumbnails */
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  BatchApi,
  RobloxWebAssetsAssetResponseItemV1,
  V1AssetGetRequest,
} from '@rbx/clients/assetdelivery';
import { getBEDEV1ServiceBasePath } from './utils';

export type { V1AssetGetRequest as AssetGetRequest };
const basePath = getBEDEV1ServiceBasePath('assetdelivery');

const assetdeliveryBatchApi = new BatchApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath,
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

export interface AssetRequestItem {
  assetId: number;
  requestId: string;
}

export interface AssetdeliveryClient {
  getAssets(
    assetRequestItems: AssetRequestItem[],
  ): Promise<Array<RobloxWebAssetsAssetResponseItemV1>>;
}

const assetdeliveryClient: AssetdeliveryClient = {
  async getAssets(assetRequestItems: AssetRequestItem[]) {
    const { raw } = await assetdeliveryBatchApi.v1AssetsBatchPostRaw({
      robloxPlaceId: 0,
      accept: '',
      assetRequestItems,
      robloxBrowserAssetRequest: '',
    });
    return (await raw.json()) as Array<RobloxWebAssetsAssetResponseItemV1>;
  },
};

export default assetdeliveryClient;

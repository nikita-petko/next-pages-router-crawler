import type {
  RobloxWebAssetsAssetResponseItemV1,
  V1AssetGetRequest,
} from '@rbx/client-assetdelivery/v1';
import { BatchApi } from '@rbx/client-assetdelivery/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { V1AssetGetRequest as AssetGetRequest };

const assetdeliveryBatchApi = new BatchApi(createClientConfiguration('assetdelivery', 'bedev1'));

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
    // oxlint-disable-next-line no-unsafe-type-assertion -- raw.json() returns unknown
    return (await raw.json()) as Array<RobloxWebAssetsAssetResponseItemV1>;
  },
};

export default assetdeliveryClient;

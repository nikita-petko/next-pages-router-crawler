import { Configuration } from '@rbx/clients';
import { DeepCopyApi, StatusApi, OperationType } from '@rbx/clients/creatorAssetToolingApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export class CreatorAssetToolingClient {
  private deepCopyApi: DeepCopyApi;

  private statusApi: StatusApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('creator-asset-tooling-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
    });
    this.deepCopyApi = new DeepCopyApi(configuration);
    this.statusApi = new StatusApi(configuration);
  }

  createDeepCopy(params: { sourceAssetId: number; destinationAssetName: string }) {
    const { sourceAssetId, destinationAssetName } = params;
    return this.deepCopyApi.deepCopyCreateDeepCopy({
      deepCopyCreateDeepCopyRequest: {
        sourceAssetIdentifier: { sourceAssetId },
        destinationAssetName,
      },
    });
  }

  getOperationStatus(operationId: string) {
    return this.statusApi.statusGetStatus({
      statusGetStatusRequest: { operationType: OperationType.DeepCopy, operationId },
    });
  }
}

const creatorAssetToolingClient = new CreatorAssetToolingClient();
export default creatorAssetToolingClient;

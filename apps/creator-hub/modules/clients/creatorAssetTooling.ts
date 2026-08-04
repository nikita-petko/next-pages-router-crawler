import {
  AssetDependenciesApi,
  DeepCopyApi,
  StatusApi,
  OperationType,
  type AssetDependenciesChildFilter,
} from '@rbx/client-creator-asset-tooling-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class CreatorAssetToolingClient {
  private assetDependenciesApi: AssetDependenciesApi;

  private deepCopyApi: DeepCopyApi;

  private statusApi: StatusApi;

  constructor() {
    const configuration = createClientConfiguration('creator-asset-tooling-api', 'bedev2');
    this.assetDependenciesApi = new AssetDependenciesApi(configuration);
    this.deepCopyApi = new DeepCopyApi(configuration);
    this.statusApi = new StatusApi(configuration);
  }

  getAssetDependencies(params: {
    sourceAssetId: number;
    sourceAssetVersionNumber?: number;
    pageSize: number;
    pageToken?: string;
    filter?: AssetDependenciesChildFilter;
  }) {
    const { sourceAssetId, sourceAssetVersionNumber, pageSize, pageToken, filter } = params;
    return this.assetDependenciesApi.assetDependenciesGetAssetDependencies({
      assetDependenciesGetAssetDependenciesRequest: {
        sourceAssetIdentifier: { sourceAssetId, sourceAssetVersionNumber },
        pageSize,
        pageToken,
        filter,
      },
    });
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

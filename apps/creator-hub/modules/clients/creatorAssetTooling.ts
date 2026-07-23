import { DeepCopyApi, StatusApi, OperationType } from '@rbx/client-creator-asset-tooling-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class CreatorAssetToolingClient {
  private deepCopyApi: DeepCopyApi;

  private statusApi: StatusApi;

  constructor() {
    const configuration = createClientConfiguration('creator-asset-tooling-api', 'bedev2');
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

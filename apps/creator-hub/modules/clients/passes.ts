import type {
  GamePassesGetSalesLimitInfoRequest as GetSalesLimitInfoRequest,
  GamePass,
  GamePassConfigV2,
  GamePassesBulkUpdateOperationRequest,
  GamePassesListGamePassesByUniverseRequest,
  GamePassesListGamePassConfigsByUniverseRequest,
  GamePassesGetGamePassConfigRequest,
  GamePassesCreateGamePassRequest,
  GamePassesUpdateGamePassRequest,
  ListGamePassConfigsByUniverseResponse,
  BatchGetGamePassConfigsResponse,
  ErrorResponse,
} from '@rbx/client-game-passes-http-service/v1';
import { GamePassesApi, ErrorCode } from '@rbx/client-game-passes-http-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  GamePass,
  GamePassConfigV2,
  ListGamePassConfigsByUniverseResponse,
  BatchGetGamePassConfigsResponse,
  ErrorResponse,
};

export { ErrorCode as GamePassErrorCode };

export class PassesClient {
  private passesApi;

  constructor() {
    this.passesApi = new GamePassesApi(createClientConfiguration('game-passes', 'bedev2'));
  }

  getPassSalesLimitInfo(request: GetSalesLimitInfoRequest, options?: RequestInit) {
    return this.passesApi.gamePassesGetSalesLimitInfo(request, options);
  }

  getPassMetadata(options?: RequestInit) {
    return this.passesApi.gamePassesGetGamePassMetadata(options);
  }

  batchUpdateGamePasses(request: GamePassesBulkUpdateOperationRequest, options?: RequestInit) {
    return this.passesApi.gamePassesBulkUpdate(request, options);
  }

  listGamePassesByUniverse(
    request: GamePassesListGamePassesByUniverseRequest,
    options?: RequestInit,
  ) {
    return this.passesApi.gamePassesListGamePassesByUniverse(request, options);
  }

  getGamePassConfig(request: GamePassesGetGamePassConfigRequest, options?: RequestInit) {
    return this.passesApi.gamePassesGetGamePassConfig(request, options);
  }

  listGamePassConfigsByUniverse(
    request: GamePassesListGamePassConfigsByUniverseRequest,
    options?: RequestInit,
  ) {
    return this.passesApi.gamePassesListGamePassConfigsByUniverse(request, options);
  }

  batchGetGamePassConfigs(
    request: { universeId: number; gamePassIds: number[] },
    options?: RequestInit,
  ): Promise<BatchGetGamePassConfigsResponse> {
    return this.passesApi.gamePassesBatchGetGamePassConfigs(
      {
        universeId: request.universeId,
        gamePassesBatchGetGamePassConfigsRequest: {
          gamePassIds: request.gamePassIds,
        },
      },
      options,
    );
  }

  createGamePass(request: GamePassesCreateGamePassRequest, options?: RequestInit) {
    return this.passesApi.gamePassesCreateGamePass(request, options);
  }

  updateGamePass(request: GamePassesUpdateGamePassRequest, options?: RequestInit) {
    return this.passesApi.gamePassesUpdateGamePass(request, options);
  }
}

const passesClient = new PassesClient();
export default passesClient;

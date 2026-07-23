import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GamePassesApi,
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
} from '@rbx/clients/gamePassesHttpService/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  GamePass,
  GamePassConfigV2,
  ListGamePassConfigsByUniverseResponse,
  BatchGetGamePassConfigsResponse,
};

export class PassesClient {
  private passesApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('game-passes')) {
    this.passesApi = new GamePassesApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  getPassSalesLimitInfo(request: GetSalesLimitInfoRequest, options?: RequestInit) {
    return this.passesApi.gamePassesGetSalesLimitInfo(request, options);
  }

  getPassMetadata(options?: RequestInit) {
    return this.passesApi.gamePassesGetGamePassMetadata(options);
  }

  updatePasses(request: GamePassesBulkUpdateOperationRequest, options?: RequestInit) {
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

  // TODO: cut over to BatchGetGamePassConfigs when available
  batchGetGamePassConfigs(
    request: { universeId: number; gamePassIds: number[] },
    options?: RequestInit,
  ): Promise<BatchGetGamePassConfigsResponse> {
    return this.passesApi.gamePassesGetGamePassesByIdsForCreator(
      {
        universeId: request.universeId,
        gamePassesGetGamePassesByIdsForCreatorRequest: {
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

import { Configuration } from '@rbx/clients';
import {
  V1MatchmakingPlayerAttributePostRequest,
  CreateMatchmakingPlayerAttributeDefinitionResponse,
  MatchmakingCustomizationApi,
  GameInstancesApi,
  V1MatchmakingPlayerAttributeAttributeIdPatchRequest,
  UpdateMatchmakingPlayerAttributeDefinitionResponse,
  V1MatchmakingPlayerAttributeAttributeIdDeleteRequest,
  V1MatchmakingPlayerAttributesUniverseIdGetRequest,
  ListMatchmakingPlayerAttributeDefinitionsResponse,
  V1MatchmakingServerAttributeAttributeIdDeleteRequest,
  V1MatchmakingScoringConfigurationPostRequest,
  CreateMatchmakingScoringConfigurationResponse,
  ListMatchmakingScoringConfigurationsResponse,
  V1MatchmakingScoringConfigurationsUniverseIdGetRequest,
  V1MatchmakingScoringConfigurationScoringConfigurationIdPatchRequest,
  UpdateMatchmakingScoringConfigurationResponse,
  GetMatchmakingScoringConfigurationResponse,
  V1MatchmakingScoringConfigurationScoringConfigurationIdGetRequest,
  V1MatchmakingScoringConfigurationScoringConfigurationIdDeleteRequest,
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsPostRequest,
  CreateCustomMatchmakingSignalResponse,
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNamePatchRequest,
  UpdateCustomMatchmakingSignalResponse,
  ListPlaceMatchmakingScoringConfigurationsResponse,
  V1MatchmakingScoringConfigurationsUniverseIdPlacesGetRequest,
  DeleteCustomMatchmakingSignalResponse,
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNameDeleteRequest,
  V1MatchmakingScoringConfigurationPlacePlaceIdDeleteRequest,
  SetMatchmakingScoringConfigurationResponse,
  V1MatchmakingScoringConfigurationPlacePostRequest,
  UpdateMatchmakingServerAttributeDefinitionResponse,
  V1MatchmakingServerAttributeAttributeIdPatchRequest,
  V1MatchmakingServerAttributePostRequest,
  CreateMatchmakingServerAttributeDefinitionResponse,
  ListMatchmakingServerAttributeDefinitionsResponse,
  V1MatchmakingServerAttributesUniverseIdGetRequest,
  V1MatchmakingUniverseUniverseIdFeatureFlagsGetRequest,
  GetMatchmakingCustomizationFeatureFlagsResponse,
  GetMatchmakingScoringDefaultWeightsResponse,
  V1MatchmakingScoringConfigurationGenerateMockServersGetRequest,
  GenerateMockServerSignalValuesResponse,
  V1GameInstancesForecastUpdatePostRequest,
  V1GameInstancesLaunchUpdatePostRequest,
  V1GameInstancesGetUpdateStatusGetRequest,
  ForecastUpdateResponse,
  LaunchUpdateResponse,
  GetUpdateStatusResponse,
} from '@rbx/clients/matchmakingApi/v1';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

export type GetIsFeatureEnabledForUniverseRequest =
  V1MatchmakingUniverseUniverseIdFeatureFlagsGetRequest;

export type GetDefaultServerRequest =
  V1MatchmakingScoringConfigurationGenerateMockServersGetRequest;

export type CreatePlayerAttributeRequest = V1MatchmakingPlayerAttributePostRequest;
export type UpdatePlayerAttributeRequest = V1MatchmakingPlayerAttributeAttributeIdPatchRequest;
export type DeletePlayerAttributeRequest = V1MatchmakingPlayerAttributeAttributeIdDeleteRequest;
export type GetPlayerAttributesRequest = V1MatchmakingPlayerAttributesUniverseIdGetRequest;

export type CreateServerAttributeRequest = V1MatchmakingServerAttributePostRequest;
export type UpdateServerAttributeRequest = V1MatchmakingServerAttributeAttributeIdPatchRequest;
export type DeleteServerAttributeRequest = V1MatchmakingServerAttributeAttributeIdDeleteRequest;
export type GetServerAttributesRequest = V1MatchmakingServerAttributesUniverseIdGetRequest;

export type CreateScoringConfigurationRequest = V1MatchmakingScoringConfigurationPostRequest;
export type UpdateScoringConfigurationRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdPatchRequest;
export type DeleteScoringConfigurationRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdDeleteRequest;
export type SetScoringConfigurationForPlaceRequest =
  V1MatchmakingScoringConfigurationPlacePostRequest;
export type GetScoringConfigurationByConfigurationIdRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdGetRequest;
export type GetScoringConfigurationsByUniverseIdRequest =
  V1MatchmakingScoringConfigurationsUniverseIdGetRequest;
export type GetPlacesWithScoringConfigurationsByUniverseIdRequest =
  V1MatchmakingScoringConfigurationsUniverseIdPlacesGetRequest;
export type DeleteScoringConfigurationFromPlaceRequest =
  V1MatchmakingScoringConfigurationPlacePlaceIdDeleteRequest;

export type CreateCustomSignalRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsPostRequest;
export type UpdateCustomSignalRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNamePatchRequest;
export type DeleteCustomSignalRequest =
  V1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNameDeleteRequest;

// Game instance update APIs
export type ForecastUpdateRequest = V1GameInstancesForecastUpdatePostRequest;
export type LaunchUpdateRequest = V1GameInstancesLaunchUpdatePostRequest;
export type GetUpdateStatusRequest = V1GameInstancesGetUpdateStatusGetRequest;

const basePath = getBEDEV2ServiceBasePath('matchmaking-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

export class MatchmakingClient {
  matchmakingApi = new MatchmakingCustomizationApi(configuration);

  gameInstancesApi = new GameInstancesApi(configuration);

  // Feature flag
  async getIsFeatureEnabledForUniverse(
    request: GetIsFeatureEnabledForUniverseRequest,
  ): Promise<GetMatchmakingCustomizationFeatureFlagsResponse> {
    return this.matchmakingApi.v1MatchmakingUniverseUniverseIdFeatureFlagsGet(request);
  }

  // Default weights
  async getDefaultWeights(): Promise<GetMatchmakingScoringDefaultWeightsResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationDefaultWeightsGet();
  }

  // Default server values
  async getDefaultServer(
    request: GetDefaultServerRequest,
  ): Promise<GenerateMockServerSignalValuesResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationGenerateMockServersGet(request);
  }

  // Player attributes operations
  async createPlayerAttribute(
    request: CreatePlayerAttributeRequest,
  ): Promise<CreateMatchmakingPlayerAttributeDefinitionResponse> {
    return this.matchmakingApi.v1MatchmakingPlayerAttributePost(request);
  }

  async updatePlayerAttribute(
    request: UpdatePlayerAttributeRequest,
  ): Promise<UpdateMatchmakingPlayerAttributeDefinitionResponse> {
    return this.matchmakingApi.v1MatchmakingPlayerAttributeAttributeIdPatch(request);
  }

  async deletePlayerAttribute(request: DeletePlayerAttributeRequest): Promise<void> {
    await this.matchmakingApi.v1MatchmakingPlayerAttributeAttributeIdDelete(request);
  }

  async getPlayerAttributes(
    request: GetPlayerAttributesRequest,
  ): Promise<ListMatchmakingPlayerAttributeDefinitionsResponse> {
    return this.matchmakingApi.v1MatchmakingPlayerAttributesUniverseIdGet(request);
  }

  // Server attributes operations
  async createServerAttribute(
    request: CreateServerAttributeRequest,
  ): Promise<CreateMatchmakingServerAttributeDefinitionResponse> {
    return this.matchmakingApi.v1MatchmakingServerAttributePost(request);
  }

  async updateServerAttribute(
    request: UpdateServerAttributeRequest,
  ): Promise<UpdateMatchmakingServerAttributeDefinitionResponse> {
    return this.matchmakingApi.v1MatchmakingServerAttributeAttributeIdPatch(request);
  }

  async deleteServerAttribute(request: DeleteServerAttributeRequest): Promise<void> {
    await this.matchmakingApi.v1MatchmakingServerAttributeAttributeIdDelete(request);
  }

  async getServerAttributes(
    request: GetServerAttributesRequest,
  ): Promise<ListMatchmakingServerAttributeDefinitionsResponse> {
    return this.matchmakingApi.v1MatchmakingServerAttributesUniverseIdGet(request);
  }

  // Scoring configurations operations
  async createScoringConfiguration(
    request: CreateScoringConfigurationRequest,
  ): Promise<CreateMatchmakingScoringConfigurationResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationPost(request);
  }

  async updateScoringConfiguration(
    request: UpdateScoringConfigurationRequest,
  ): Promise<UpdateMatchmakingScoringConfigurationResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdPatch(
      request,
    );
  }

  async deleteScoringConfiguration(request: DeleteScoringConfigurationRequest): Promise<object> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdDelete(
      request,
    );
  }

  async setScoringConfigurationForPlace(
    request: SetScoringConfigurationForPlaceRequest,
  ): Promise<SetMatchmakingScoringConfigurationResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationPlacePost(request);
  }

  async getScoringConfigurationByScoringConfigurationId(
    request: GetScoringConfigurationByConfigurationIdRequest,
  ): Promise<GetMatchmakingScoringConfigurationResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdGet(request);
  }

  async getScoringConfigurationsByUniverseId(
    request: GetScoringConfigurationsByUniverseIdRequest,
  ): Promise<ListMatchmakingScoringConfigurationsResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationsUniverseIdGet(request);
  }

  async getPlacesWithScoringConfigurationsByUniverseId(
    request: GetPlacesWithScoringConfigurationsByUniverseIdRequest,
  ): Promise<ListPlaceMatchmakingScoringConfigurationsResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationsUniverseIdPlacesGet(request);
  }

  async deleteScoringConfigurationFromPlace(
    request: DeleteScoringConfigurationFromPlaceRequest,
  ): Promise<object> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationPlacePlaceIdDelete(request);
  }

  // Scoring configuration signal operations
  async createCustomSignal(
    request: CreateCustomSignalRequest,
  ): Promise<CreateCustomMatchmakingSignalResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdSignalsPost(
      request,
    );
  }

  async updateCustomSignal(
    request: UpdateCustomSignalRequest,
  ): Promise<UpdateCustomMatchmakingSignalResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNamePatch(
      request,
    );
  }

  async deleteCustomSignal(
    request: DeleteCustomSignalRequest,
  ): Promise<DeleteCustomMatchmakingSignalResponse> {
    return this.matchmakingApi.v1MatchmakingScoringConfigurationScoringConfigurationIdSignalsSignalNameDelete(
      request,
    );
  }

  // Game instance update APIs
  async forecastUpdate(request: ForecastUpdateRequest): Promise<ForecastUpdateResponse> {
    return this.gameInstancesApi.v1GameInstancesForecastUpdatePost(request);
  }

  async launchUpdate(request: LaunchUpdateRequest): Promise<LaunchUpdateResponse> {
    return this.gameInstancesApi.v1GameInstancesLaunchUpdatePost(request);
  }

  async getUpdateStatus(request: GetUpdateStatusRequest): Promise<GetUpdateStatusResponse> {
    return this.gameInstancesApi.v1GameInstancesGetUpdateStatusGet(request);
  }
}

export const matchmakingClient = new MatchmakingClient();

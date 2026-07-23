import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GetJoinRestrictionsOperationResponse,
  GetOwnedPlacesByCreationContextV2Response,
  GetPlaceJoinRestrictionsOperationResponse,
  PlacesAddPlaceToUniverseRequest,
  PlacesApi,
  PlacesGetJoinRestrictionsRequest,
  PlacesGetOwnedPlacesByCreationContextRequest,
  PlacesMigrateUniverseRequest,
  PlacesRemovePlaceFromUniverseRequest,
  GetOwnedPlacesByCreationContextOperationResponseModelDataItems,
  GetUniverseContainingPlaceResponse,
  SearchApi,
  SearchSearchUniversesRequest as SearchUniversesRequest,
  SearchUniversesResponse,
  PlacesClearJoinRestrictionsOverridesRequest,
  PlacesGetPlaceJoinRestrictionsRequest,
  PlacesUpdateJoinRestrictionsOperationRequest,
  PlacesUpdatePlaceJoinRestrictionsOperationRequest,
  CreateUniverseOperationResponse,
  PlacesCreateUniverseOperationRequest,
} from '@rbx/clients/universesApi';
import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import { getBEDEV2ServiceBasePath } from './utils';
import tryParseResponseError from './utils/tryParseResponseError';

export type {
  SearchUniversesRequest as V1SearchUniversesRequest,
  SearchUniversesResponse as V1SearchUniversesResponse,
};

export type PlacesItems = GetOwnedPlacesByCreationContextOperationResponseModelDataItems;

export class UniversesClient {
  private placesApi;

  private searchApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('universes')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.placesApi = new PlacesApi(defaultConfig);
    this.searchApi = new SearchApi(defaultConfig);
  }

  async addPlaceToUniverse(
    requestParameters: PlacesAddPlaceToUniverseRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesAddPlaceToUniverse(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async removePlaceFromUniverse(
    requestParameters: PlacesRemovePlaceFromUniverseRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesRemovePlaceFromUniverse(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async getOwnedPlacesByContext(
    initOverrides?: RequestInit,
    requestParameters: PlacesGetOwnedPlacesByCreationContextRequest = {},
  ): Promise<GetOwnedPlacesByCreationContextV2Response> {
    try {
      return await this.placesApi.placesGetOwnedPlacesByCreationContext(
        requestParameters,
        initOverrides,
      );
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async getOwnedPlacesByContextV2(
    initOverrides?: RequestInit,
    requestParameters: PlacesGetOwnedPlacesByCreationContextRequest = {},
  ): Promise<GetOwnedPlacesByCreationContextV2Response> {
    try {
      return await this.placesApi.placesGetOwnedPlacesByCreationContext(
        requestParameters,
        initOverrides,
      );
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async getJoinRestrictions(
    requestParameters: PlacesGetJoinRestrictionsRequest,
    initOverrides?: RequestInit,
  ): Promise<GetJoinRestrictionsOperationResponse> {
    try {
      return await this.placesApi.placesGetJoinRestrictions(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async updateJoinRestrictions(
    requestParameters: PlacesUpdateJoinRestrictionsOperationRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesUpdateJoinRestrictions(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async searchUniverses(request: SearchUniversesRequest): Promise<SearchUniversesResponse> {
    return this.searchApi.searchSearchUniverses(request);
  }

  async migrateUniverse(
    requestParameters: PlacesMigrateUniverseRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesMigrateUniverse(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async getUniverseContainingPlace(placeId: number): Promise<GetUniverseContainingPlaceResponse> {
    try {
      return await this.placesApi.placesGetUniverseContainingPlace({ placeId });
    } catch (e) {
      const error = await tryParseResponseError(e as Response);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async getPlaceJoinRestrictions(
    requestParameters: PlacesGetPlaceJoinRestrictionsRequest,
    initOverrides?: RequestInit,
  ): Promise<GetPlaceJoinRestrictionsOperationResponse> {
    try {
      return await this.placesApi.placesGetPlaceJoinRestrictions(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async updatePlaceJoinRestrictions(
    requestParameters: PlacesUpdatePlaceJoinRestrictionsOperationRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesUpdatePlaceJoinRestrictions(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async clearJoinRestrictionsOverrides(
    requestParameters: PlacesClearJoinRestrictionsOverridesRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.placesApi.placesClearJoinRestrictionsOverrides(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async createUniverse(
    requestParameters: PlacesCreateUniverseOperationRequest,
    initOverrides?: RequestInit,
  ): Promise<CreateUniverseOperationResponse> {
    try {
      return await this.placesApi.placesCreateUniverse(requestParameters, initOverrides);
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }
}

const universesClient = new UniversesClient();
export default universesClient;

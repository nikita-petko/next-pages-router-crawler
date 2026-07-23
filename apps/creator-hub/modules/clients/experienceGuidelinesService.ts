import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getErrorStatus } from '@modules/clients';
import {
  V1Beta1MultiGetCreatorEligibilityResponse,
  V1Beta1MultiGetCreatorEligibilityRequest,
  V1Beta1CreatorEligibilityAction,
} from '@rbx/clients/experienceGuidelinesService';

import {
  ExperienceGuidelinesServiceAPIApi,
  V1Beta1SaveCreatorOverridesRequest,
  V1Beta1GetDetailedGuidelinesResponse,
  V1Beta1GetDetailedGuidelinesRequest,
  V1beta1DetailedGuidelinesPostRequest,
  V1Beta1MultiGetAgeRecommendationResponse,
  V1Beta1MultiGetAgeRecommendationRequest,
  V1beta1MultiAgeRecommendationPostRequest,
  V1beta1MultiCreatorEligibilityPostRequest,
  V1Beta1GetCreatorControlsAgeRestrictionResponse as GetCreatorControlsAgeRestrictionResponse,
  V1Beta1SaveCreatorControlsAgeRestrictionRequest as SaveCreatorControlsAgeRestrictionRequest,
  V1beta1CreatorControlsAgeRestrictionUniverseIdGetRequest as CreatorControlsAgeRestrictionUniverseIdGetRequest,
  V1beta1CreatorControlsAgeRestrictionUniverseIdPostRequest as CreatorControlsAgeRestrictionUniverseIdPostRequest,
  V1Beta1CreatorControlsAgeRestriction as CreatorControlsAgeRestriction,
  V1Beta1GetCreatorControlsGeoRestrictionResponse as GetCreatorControlsGeoRestrictionResponse,
  V1Beta1SaveCreatorControlsGeoRestrictionRequest as SaveCreatorControlsGeoRestrictionRequest,
  V1beta1CreatorControlsGeoRestrictionUniverseIdGetRequest as CreatorControlsGeoRestrictionUniverseIdGetRequest,
  V1beta1CreatorControlsGeoRestrictionUniverseIdPostRequest as CreatorControlsGeoRestrictionUniverseIdPostRequest,
  V1Beta1CreatorControlsGeoRestriction as CreatorControlsGeoRestriction,
  V1Beta1GetAllCountriesResponse as GetAllCountriesResponse,
  V2Beta1GetDetailedGuidelinesRequest,
  V2Beta1GetDetailedGuidelinesResponse,
  V1beta1CreatorOverridesPostRequest,
  V1Beta1CreatorOverrides,
  V2beta1DetailedGuidelinesPostRequest,
} from '@rbx/clients/experienceGuidelinesService/v1';
import { StatusCodes } from '@rbx/core';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  V1Beta1GetDetailedGuidelinesResponse as GetDetailedGuidelinesResponse,
  V1Beta1MultiGetAgeRecommendationResponse as MultiGetAgeRecommendationResponse,
  V1Beta1MultiGetCreatorEligibilityResponse as MultiGetCreatorEligibilityResponse,
  V1Beta1CreatorControlsAgeRestriction as CreatorControlsAgeRestriction,
  V1Beta1CreatorControlsGeoRestriction as CreatorControlsGeoRestriction,
  V1Beta1CountryInfo,
  V2Beta1GetDetailedGuidelinesResponse as GetDetailedGuidelinesResponseV2,
} from '@rbx/clients/experienceGuidelinesService/v1';

export enum CreatorEligibility {
  NotEligible = 0,
  NotEligibleUpsell = 1,
  Eligible = 2,
}

async function attemptNetworkRequestWithRetry<T>(callback: () => Promise<T>): Promise<T> {
  try {
    const callbackRes = await callback();
    return callbackRes;
  } catch (e) {
    const status = getErrorStatus(e);
    if (
      status === StatusCodes.BAD_GATEWAY ||
      status === StatusCodes.GATEWAY_TIMEOUT ||
      status === StatusCodes.REQUEST_TIMEOUT ||
      status === StatusCodes.INTERNAL_SERVER_ERROR ||
      status === StatusCodes.SERVICE_UNAVAILABLE
    ) {
      const callbackRes = await callback();
      return callbackRes;
    }
    throw e;
  }
}

export class ExperienceGuidelinesServiceApiClient {
  private experienceGuidelinesServiceApi: ExperienceGuidelinesServiceAPIApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('experience-guidelines-service')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.experienceGuidelinesServiceApi = new ExperienceGuidelinesServiceAPIApi(configuration);
  }

  getDetailedGuidelines(universeId: number): Promise<V1Beta1GetDetailedGuidelinesResponse> {
    const v1Beta1GetDetailedGuidelinesRequest: V1Beta1GetDetailedGuidelinesRequest = {
      universeId,
    };
    const req: V1beta1DetailedGuidelinesPostRequest = {
      v1Beta1GetDetailedGuidelinesRequest,
    };
    return this.experienceGuidelinesServiceApi.v1beta1DetailedGuidelinesPost(req);
  }

  getDetailedGuidelinesV2(universeId: number): Promise<V2Beta1GetDetailedGuidelinesResponse> {
    const v2Beta1GetDetailedGuidelinesRequest: V2Beta1GetDetailedGuidelinesRequest = {
      universeId,
    };
    const req: V2beta1DetailedGuidelinesPostRequest = {
      v2Beta1GetDetailedGuidelinesRequest,
    };
    return this.experienceGuidelinesServiceApi.v2beta1DetailedGuidelinesPost(req);
  }

  saveCreatorOverrides(
    universeId: number,
    creatorOverrides: V1Beta1CreatorOverrides,
  ): Promise<object> {
    const v1Beta1SaveCreatorOverridesRequest: V1Beta1SaveCreatorOverridesRequest = {
      universeId,
      creatorOverrides,
    };
    const req: V1beta1CreatorOverridesPostRequest = {
      v1Beta1SaveCreatorOverridesRequest,
    };
    return this.experienceGuidelinesServiceApi.v1beta1CreatorOverridesPost(req);
  }

  async multiGetAgeRecommendations(
    universeIds: Array<number>,
    withRetry = false,
  ): Promise<V1Beta1MultiGetAgeRecommendationResponse> {
    const v1Beta1MultiGetAgeRecommendationRequest: V1Beta1MultiGetAgeRecommendationRequest = {
      universeIds,
    };
    const postRequest: V1beta1MultiAgeRecommendationPostRequest = {
      v1Beta1MultiGetAgeRecommendationRequest,
    };
    if (withRetry) {
      return attemptNetworkRequestWithRetry(() =>
        this.experienceGuidelinesServiceApi.v1beta1MultiAgeRecommendationPost(postRequest),
      );
    }
    return this.experienceGuidelinesServiceApi.v1beta1MultiAgeRecommendationPost(postRequest);
  }

  async multiGetCreatorEligibility(
    universeId: number,
    userIds: Array<number>,
    action: V1Beta1CreatorEligibilityAction,
    withRetry = false,
  ): Promise<V1Beta1MultiGetCreatorEligibilityResponse> {
    const v1Beta1MultiGetCreatorEligibilityRequest: V1Beta1MultiGetCreatorEligibilityRequest = {
      universeId,
      userIds,
      action,
    };

    const postRequest: V1beta1MultiCreatorEligibilityPostRequest = {
      v1Beta1MultiGetCreatorEligibilityRequest,
    };

    if (withRetry) {
      return attemptNetworkRequestWithRetry(() =>
        this.experienceGuidelinesServiceApi.v1beta1MultiCreatorEligibilityPost(postRequest),
      );
    }
    return this.experienceGuidelinesServiceApi.v1beta1MultiCreatorEligibilityPost(postRequest);
  }

  getCreatorControlsAgeRestriction(
    universeId: number,
  ): Promise<GetCreatorControlsAgeRestrictionResponse> {
    const req: CreatorControlsAgeRestrictionUniverseIdGetRequest = {
      universeId,
    };
    return this.experienceGuidelinesServiceApi.v1beta1CreatorControlsAgeRestrictionUniverseIdGet(
      req,
    );
  }

  saveCreatorControlsAgeRestriction(
    universeId: number,
    ageRestriction: CreatorControlsAgeRestriction,
  ): Promise<object> {
    const v1Beta1SaveCreatorControlsAgeRestrictionRequest: SaveCreatorControlsAgeRestrictionRequest =
      {
        universeId,
        ageRestriction,
      };
    const req: CreatorControlsAgeRestrictionUniverseIdPostRequest = {
      universeId,
      v1Beta1SaveCreatorControlsAgeRestrictionRequest,
    };
    return this.experienceGuidelinesServiceApi.v1beta1CreatorControlsAgeRestrictionUniverseIdPost(
      req,
    );
  }

  getCreatorControlsGeoRestriction(
    universeId: number,
  ): Promise<GetCreatorControlsGeoRestrictionResponse> {
    const req: CreatorControlsGeoRestrictionUniverseIdGetRequest = {
      universeId,
    };
    return this.experienceGuidelinesServiceApi.v1beta1CreatorControlsGeoRestrictionUniverseIdGet(
      req,
    );
  }

  saveCreatorControlsGeoRestriction(
    universeId: number,
    geoRestriction: CreatorControlsGeoRestriction,
  ): Promise<object> {
    const v1Beta1SaveCreatorControlsGeoRestrictionRequest: SaveCreatorControlsGeoRestrictionRequest =
      {
        universeId,
        geoRestriction,
      };
    const req: CreatorControlsGeoRestrictionUniverseIdPostRequest = {
      universeId,
      v1Beta1SaveCreatorControlsGeoRestrictionRequest,
    };
    return this.experienceGuidelinesServiceApi.v1beta1CreatorControlsGeoRestrictionUniverseIdPost(
      req,
    );
  }

  getAllCountries(withRetry = false): Promise<GetAllCountriesResponse> {
    if (withRetry) {
      return attemptNetworkRequestWithRetry(() =>
        this.experienceGuidelinesServiceApi.v1beta1CountriesGet(),
      );
    }
    return this.experienceGuidelinesServiceApi.v1beta1CountriesGet();
  }
}

const experienceGuidelinesServiceApiClient = new ExperienceGuidelinesServiceApiClient();

export default experienceGuidelinesServiceApiClient;

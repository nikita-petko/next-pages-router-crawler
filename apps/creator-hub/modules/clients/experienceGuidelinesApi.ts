import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ExperienceGuidelinesGetDescriptorsByNameRequest,
  ExperienceGuidelinesApi,
  GetExperienceRestrictionsByUniverseIdResponse,
  GetDescriptorsByNameResponse,
  GetDescriptorsByNameRequest,
  GetExperienceRestrictionsByUniverseIdRequest,
  ExperienceGuidelinesGetExperienceRestrictionsByUniverseIdRequest,
  ExperienceGuidelinesGetAgeRecommendationRequest,
  GetAgeRecommendationResponse,
  GetAgeRecommendationRequest,
} from '@rbx/clients/experienceGuidelinesApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  GetDescriptorsByNameResponse,
  GetExperienceRestrictionsByUniverseIdResponse,
  RestrictedCountry as ExperienceGuidelinesRestrictedCountry,
  ExperienceDescriptor as ExperienceGuidelinesContentDescriptor,
  Moderation,
  ModerationStatus,
  ExperienceDescriptorUsage,
} from '@rbx/clients/experienceGuidelinesApi/v1';

export class ExperienceGuidelinesApiClient {
  private experienceGuidelinesApi: ExperienceGuidelinesApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('experience-guidelines-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.experienceGuidelinesApi = new ExperienceGuidelinesApi(configuration);
  }

  getExperienceRestrictionsByUniverseId(
    universeId: number,
  ): Promise<GetExperienceRestrictionsByUniverseIdResponse> {
    const getExperienceRestrictionsByUniverseIdRequest: GetExperienceRestrictionsByUniverseIdRequest =
      {
        universeId,
      };
    const req: ExperienceGuidelinesGetExperienceRestrictionsByUniverseIdRequest = {
      getExperienceRestrictionsByUniverseIdRequest,
    };
    return this.experienceGuidelinesApi.experienceGuidelinesGetExperienceRestrictionsByUniverseId(
      req,
    );
  }

  getDescriptorsByName(
    descriptorNames: Array<string>,
    localeCode: string | null,
  ): Promise<GetDescriptorsByNameResponse> {
    const getDescriptorsByNameRequest: GetDescriptorsByNameRequest = {
      descriptorNames,
      localeCode,
    };
    const req: ExperienceGuidelinesGetDescriptorsByNameRequest = {
      getDescriptorsByNameRequest,
    };
    return this.experienceGuidelinesApi.experienceGuidelinesGetDescriptorsByName(req);
  }

  getAgeRecommendation(universeId: number): Promise<GetAgeRecommendationResponse> {
    const getAgeRecommendationRequest: GetAgeRecommendationRequest = {
      universeId,
    };
    const req: ExperienceGuidelinesGetAgeRecommendationRequest = {
      getAgeRecommendationRequest,
    };
    return this.experienceGuidelinesApi.experienceGuidelinesGetAgeRecommendation(req);
  }
}

const experienceGuidelinesApiClient = new ExperienceGuidelinesApiClient();

export default experienceGuidelinesApiClient;

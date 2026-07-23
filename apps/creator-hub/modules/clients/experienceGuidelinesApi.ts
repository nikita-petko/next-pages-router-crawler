import type {
  ExperienceGuidelinesGetDescriptorsByNameRequest,
  GetExperienceRestrictionsByUniverseIdResponse,
  GetDescriptorsByNameResponse,
  GetDescriptorsByNameRequest,
  GetExperienceRestrictionsByUniverseIdRequest,
  ExperienceGuidelinesGetExperienceRestrictionsByUniverseIdRequest,
  ExperienceGuidelinesGetAgeRecommendationRequest,
  GetAgeRecommendationResponse,
  GetAgeRecommendationRequest,
} from '@rbx/client-experience-guidelines-api/v1';
import { ExperienceGuidelinesApi } from '@rbx/client-experience-guidelines-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  GetDescriptorsByNameResponse,
  GetExperienceRestrictionsByUniverseIdResponse,
  RestrictedCountry as ExperienceGuidelinesRestrictedCountry,
  ExperienceDescriptor as ExperienceGuidelinesContentDescriptor,
  Moderation,
  ModerationStatus,
  ExperienceDescriptorUsage,
} from '@rbx/client-experience-guidelines-api/v1';

export class ExperienceGuidelinesApiClient {
  private experienceGuidelinesApi: ExperienceGuidelinesApi;

  constructor() {
    const configuration = createClientConfiguration('experience-guidelines-api', 'bedev2');
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

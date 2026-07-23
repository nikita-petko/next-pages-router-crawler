import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ExperienceGenreAPIApi,
  V1CreatorExperienceGenreGetRequest,
  V1CreatorExperienceGenrePostRequest,
  RobloxExperienceGenreExperienceGenreAPIV1Beta1GetCreatorExperienceGenreResponse,
  RobloxExperienceGenreExperienceGenreAPIV1Beta1UpdateCreatorExperienceGenreResponse,
} from '@rbx/clients/experienceGenreService';
import GenreType from '@modules/experience-genre/enums/GenreType';

const basePath = getBEDEV2ServiceBasePath('experience-genre-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const experienceGenreService = new ExperienceGenreAPIApi(configuration);

export const getExperienceGenre = async (
  universeId: number,
  genreTaxonomyVersion: number,
  includeUpdateLockExpirationTime: boolean,
  includeCreatorSelectedGenre: boolean,
  includeNotifyGenreChange: boolean,
): Promise<RobloxExperienceGenreExperienceGenreAPIV1Beta1GetCreatorExperienceGenreResponse> => {
  const request: V1CreatorExperienceGenreGetRequest = {
    universeId,
    genreTaxonomyVersion,
    responseOptionsIncludeUpdateLockExpirationTime: includeUpdateLockExpirationTime,
    responseOptionsIncludeCreatorSelectedGenre: includeCreatorSelectedGenre,
    responseOptionsIncludeNotifyGenreChange: includeNotifyGenreChange,
  };
  const response = await experienceGenreService.v1CreatorExperienceGenreGet(request);
  return response;
};

export const updateExperienceGenre = async (
  universeId: number,
  genre: GenreType,
  genreTaxonomyVersion: number,
  includeUpdateLockExpirationTime: boolean,
): Promise<RobloxExperienceGenreExperienceGenreAPIV1Beta1UpdateCreatorExperienceGenreResponse> => {
  const request: V1CreatorExperienceGenrePostRequest = {
    robloxExperienceGenreExperienceGenreAPIV1Beta1UpdateCreatorExperienceGenreRequest: {
      universeId,
      genre,
      genreTaxonomyVersion,
      responseOptions: {
        includeUpdateLockExpirationTime,
      },
    },
  };
  const response = await experienceGenreService.v1CreatorExperienceGenrePost(request);
  return response;
};

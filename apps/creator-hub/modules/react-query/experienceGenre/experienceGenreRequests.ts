import type {
  V1CreatorExperienceGenreGetRequest,
  V1CreatorExperienceGenrePostRequest,
  RobloxExperienceGenreExperienceGenreAPIV1Beta1GetCreatorExperienceGenreResponse,
  RobloxExperienceGenreExperienceGenreAPIV1Beta1UpdateCreatorExperienceGenreResponse,
} from '@rbx/client-experience-genre-service/v1';
import { ExperienceGenreAPIApi } from '@rbx/client-experience-genre-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import type GenreType from '@modules/experience-genre/enums/GenreType';

const configuration = createClientConfiguration('experience-genre-api', 'bedev2');

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

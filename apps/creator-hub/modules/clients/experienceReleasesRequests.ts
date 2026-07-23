import type {
  V1beta1ExperienceReleasesApiReleaseStatusUniverseIdGetRequest,
  GetReleaseStatusResponse,
  V1beta1ExperienceReleasesApiReleaseStatusPostRequest,
  CreateReleaseStatusResponse,
  V1beta1ExperienceReleasesApiCanSetReleaseStatusUniverseIdStatusReleaseStatusGetRequest,
  CanSetReleaseStatusResponse,
  MultiGetReleaseStatusesResponse,
  V1beta1ExperienceReleasesApiMultiReleaseStatusesPostRequest,
} from '@rbx/client-experience-releases-api/v1';
import { ExperienceReleasesAPIApi } from '@rbx/client-experience-releases-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('experience-releases', 'bedev2');

const experienceReleasesApi = new ExperienceReleasesAPIApi(configuration);

export const getExperienceReleaseStatus = async (
  request: V1beta1ExperienceReleasesApiReleaseStatusUniverseIdGetRequest,
): Promise<GetReleaseStatusResponse> => {
  const response =
    await experienceReleasesApi.v1beta1ExperienceReleasesApiReleaseStatusUniverseIdGet(request);
  return response;
};

export const updateExperienceReleaseStatus = async (
  request: V1beta1ExperienceReleasesApiReleaseStatusPostRequest,
): Promise<CreateReleaseStatusResponse> => {
  const response =
    await experienceReleasesApi.v1beta1ExperienceReleasesApiReleaseStatusPost(request);
  return response;
};

export const canSetExperienceReleaseStatus = async (
  request: V1beta1ExperienceReleasesApiCanSetReleaseStatusUniverseIdStatusReleaseStatusGetRequest,
): Promise<CanSetReleaseStatusResponse> => {
  const response =
    await experienceReleasesApi.v1beta1ExperienceReleasesApiCanSetReleaseStatusUniverseIdStatusReleaseStatusGet(
      request,
    );
  return response;
};

export const multiGetExperienceReleaseStatuses = async (
  request: V1beta1ExperienceReleasesApiMultiReleaseStatusesPostRequest,
): Promise<MultiGetReleaseStatusesResponse> => {
  const response =
    await experienceReleasesApi.v1beta1ExperienceReleasesApiMultiReleaseStatusesPost(request);
  return response;
};

import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ExperienceReleasesAPIApi,
  V1beta1ExperienceReleasesApiReleaseStatusUniverseIdGetRequest,
  GetReleaseStatusResponse,
  V1beta1ExperienceReleasesApiReleaseStatusPostRequest,
  CreateReleaseStatusResponse,
  V1beta1ExperienceReleasesApiCanSetReleaseStatusUniverseIdStatusReleaseStatusGetRequest,
  CanSetReleaseStatusResponse,
  MultiGetReleaseStatusesResponse,
  V1beta1ExperienceReleasesApiMultiReleaseStatusesPostRequest,
} from '@rbx/clients/experienceReleases';

declare const process: { env: { [key: string]: string | undefined } };

const basePath = getBEDEV2ServiceBasePath('experience-releases');
const configuration = new Configuration({
  robloxSiteDomain: process.env.NEXT_PUBLIC_ROBLOX_SITE_DOMAIN || process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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

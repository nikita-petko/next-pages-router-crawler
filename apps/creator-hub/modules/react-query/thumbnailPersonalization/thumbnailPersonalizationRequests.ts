import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  HomepageThumbnailApi,
  HomepageThumbnailCreateThumbnailPersonalizationOperationRequest,
  HomepageThumbnailDeleteHomepageThumbnailsRequest,
  HomepageThumbnailGetHomepageThumbnailsRequest,
  HomepageThumbnailUpdateThumbnailPersonalizationOperationRequest,
  HomepageThumbnailUploadHomepageThumbnailsRequest,
} from '@rbx/clients/thumbnailPersonalizationApi';

const basePath = getBEDEV2ServiceBasePath('thumbnail-personalization-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const homepageThumbnailApi = new HomepageThumbnailApi(configuration);

export const getHomepageThumbnails = (universeId: number, nextCursor?: string, limit = 20) => {
  const request: HomepageThumbnailGetHomepageThumbnailsRequest = {
    universeId,
    nextCursor,
    limit,
  };
  return homepageThumbnailApi.homepageThumbnailGetHomepageThumbnails(request);
};

export const uploadMultipleHomepageThumbnails = async (universeId: number, files: File[]) => {
  const request: HomepageThumbnailUploadHomepageThumbnailsRequest = {
    universeId,
  };

  const formParams = new FormData();
  files.forEach((file) => {
    formParams.append('files', file);
  });

  return homepageThumbnailApi.homepageThumbnailUploadHomepageThumbnails(request, {
    body: formParams,
  });
};

export const pollUploadMultipleHomepageThumbnailsStatus = (
  universeId: number,
  operationIds: string[],
) => {
  return homepageThumbnailApi.homepageThumbnailGetHomepageThumbnailsStatus({
    universeId,
    operationIds,
  });
};

export const deleteHomepageThumbnail = (universeId: number, thumbnailIds: string[]) => {
  const request: HomepageThumbnailDeleteHomepageThumbnailsRequest = {
    universeId,
    homepageThumbnailIds: thumbnailIds,
  };
  return homepageThumbnailApi.homepageThumbnailDeleteHomepageThumbnails(request);
};

type findHomepageThumbnailPersonalizationsResponse = {
  personalizedConfigs?: Array<{
    id: string;
    personalizedConfigStatus: 'Active' | 'Inactive';
    createdUtc: string;
  }>;
};

export const findHomepageThumbnailPersonalizations = (
  universeId: number,
  active: boolean,
): Promise<findHomepageThumbnailPersonalizationsResponse> => {
  return homepageThumbnailApi.homepageThumbnailFindThumbnailPersonalizations({
    universeId,
    status: active ? 'Active' : 'Inactive',
  });
};

export const createHomepageThumbnailPersonalization = (
  universeId: number,
  thumbnailIds: string[],
) => {
  const request: HomepageThumbnailCreateThumbnailPersonalizationOperationRequest = {
    universeId,
    homepageThumbnailCreateThumbnailPersonalizationRequest: {
      homepageThumbnailIds: thumbnailIds,
    },
  };
  return homepageThumbnailApi.homepageThumbnailCreateThumbnailPersonalization(request);
};

export const updateHomepageThumbnailPersonalization = (
  universeId: number,
  personalizedConfigId: string,
  thumbnailIds: string[],
) => {
  const request: HomepageThumbnailUpdateThumbnailPersonalizationOperationRequest = {
    universeId,
    homepageThumbnailUpdateThumbnailPersonalizationRequest: {
      id: personalizedConfigId,
      homepageThumbnailIds: thumbnailIds,
    },
  };
  return homepageThumbnailApi.homepageThumbnailUpdateThumbnailPersonalization(request);
};

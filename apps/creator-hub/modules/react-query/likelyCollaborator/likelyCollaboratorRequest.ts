import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  LikelyCollaborator,
  LikelyCollaboratorApi,
  LikelyCollaboratorGetLikelyCollaboratorsRequest,
} from '@rbx/clients/likelyCollaboratorService';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const basePathAuth = getBEDEV2ServiceBasePath('likely-collaborator-service');
const likelyCollaboratorApi = new LikelyCollaboratorApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: basePathAuth,
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

// eslint-disable-next-line import/prefer-default-export -- the service currently only has one method
export const getLikelyCollaborators = async (
  userId: number,
  limit?: number,
): Promise<LikelyCollaborator[] | null | undefined> => {
  const request: LikelyCollaboratorGetLikelyCollaboratorsRequest = {
    userId,
    limit,
  };

  return (await likelyCollaboratorApi.likelyCollaboratorGetLikelyCollaborators(request))
    .likelyCollaborators;
};

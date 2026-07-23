import type {
  LikelyCollaborator,
  LikelyCollaboratorGetLikelyCollaboratorsRequest,
} from '@rbx/client-likely-collaborator-service/v1';
import { LikelyCollaboratorApi } from '@rbx/client-likely-collaborator-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const likelyCollaboratorApi = new LikelyCollaboratorApi(
  createClientConfiguration('likely-collaborator-service', 'bedev2'),
);

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

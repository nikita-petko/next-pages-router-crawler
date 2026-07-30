import { keepPreviousData, useQuery } from '@tanstack/react-query';
import likelyCollaboratorsApiClient from '../clients/likelyCollaborators';
import type { User } from '../clients/users';

type UseGetLikelyCollaboratorsParams = {
  userId?: number;
  enabled?: boolean;
};

export const useGetLikelyCollaborators = ({
  userId,
  enabled = true,
}: UseGetLikelyCollaboratorsParams = {}) => {
  return useQuery({
    queryKey: ['likelyCollaboratorApiClient/getLikelyCollaborators', userId],
    queryFn: async (): Promise<User[]> => {
      if (userId === undefined) {
        return [];
      }
      const likelyCollaborators = await likelyCollaboratorsApiClient.getLikelyCollaborators(userId);

      if (!likelyCollaborators) {
        return [];
      }

      return likelyCollaborators.flatMap((collaborator) => {
        if (collaborator.id === undefined || collaborator.id === null) {
          return [];
        }
        return [
          {
            id: collaborator.id,
            name: collaborator.name ?? undefined,
            displayName: collaborator.displayName ?? undefined,
          },
        ];
      });
    },
    initialData: [],
    placeholderData: keepPreviousData,
    enabled: enabled && userId !== undefined,
  });
};

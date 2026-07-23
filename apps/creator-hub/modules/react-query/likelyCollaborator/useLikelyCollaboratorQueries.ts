import { useQuery } from '@tanstack/react-query';
import { getLikelyCollaborators } from './likelyCollaboratorRequest';

interface UseGetLikelyCollaboratorsParams {
  userId?: number;
  enabled?: boolean;
}

// eslint-disable-next-line import/prefer-default-export -- the service currently only has one method
export function useGetLikelyCollaborators({
  userId,
  enabled = true,
}: UseGetLikelyCollaboratorsParams) {
  return useQuery({
    queryKey: ['likelyCollaboratorApiClient/getLikelyCollaborators'],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      const likelyCollaboratorData = await getLikelyCollaborators(userId);

      if (!likelyCollaboratorData) {
        return [];
      }
      return likelyCollaboratorData;
    },
    select: (data) => {
      return data.map(({ id, name, displayName }) => ({
        id: id!,
        name: name!,
        displayName: displayName!,
      }));
    },
    initialData: [],
    enabled,
  });
}

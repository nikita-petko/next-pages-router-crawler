import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsClient, SetGroupFeaturesRequestFeatures } from '@modules/clients';

export type TUseSetGroupFeaturesProps = {
  groupId: string;
  features: SetGroupFeaturesRequestFeatures;
};

export function useGetGroupFeatures(groupId?: string) {
  return useQuery({
    queryKey: ['groupFeatures', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      return groupsClient.getGroupFeatures(Number(groupId));
    },
  });
}

export function useGetGroupFeaturesStatus(groupId?: string) {
  return useQuery({
    queryKey: ['groupFeaturesStatus', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      return groupsClient.getGroupFeaturesStatus(Number(groupId));
    },
  });
}

export function useSetGroupFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, features }: TUseSetGroupFeaturesProps) => {
      return groupsClient.setGroupFeatures(Number(groupId), { features });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['groupFeatures', variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['groupFeaturesStatus', variables.groupId],
      });
    },
  });
}

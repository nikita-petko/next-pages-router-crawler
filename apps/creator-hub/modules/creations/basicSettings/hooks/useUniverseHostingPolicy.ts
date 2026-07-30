import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import playerHostedEventsClient from '@modules/clients/playerHostedEventsApi';

const hostingPolicyQueryKey = (universeId: number) => ['universeHostingPolicy', universeId];

export function useUniverseHostingPolicy(universeId: number) {
  return useQuery({
    queryKey: hostingPolicyQueryKey(universeId),
    queryFn: () => playerHostedEventsClient.getUniverseHostingPolicy(universeId),
    enabled: universeId > 0,
  });
}

export function useUpdateUniverseHostingPolicy(universeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      playerHostedEventsClient.updateUniverseHostingPolicy(universeId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostingPolicyQueryKey(universeId) }),
  });
}

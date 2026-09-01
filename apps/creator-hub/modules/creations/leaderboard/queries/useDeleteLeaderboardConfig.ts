import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { deleteLeaderboardConfig, getLeaderboardConfigQueryKey } from '../leaderboardConfigApi';
import type { LeaderboardConfig } from '../types';

type Variables = { key: string };
type MutateContext = { previousData: LeaderboardConfig | undefined };

type Options = Omit<UseMutationOptions<void, Error, Variables, MutateContext>, 'mutationFn'>;

export function useDeleteLeaderboardConfig(
  universeId: string | number | undefined,
  options: Options = {},
) {
  const queryClient = useQueryClient();
  const queryKey = getLeaderboardConfigQueryKey(universeId);

  return useMutation<void, Error, Variables, MutateContext>({
    mutationFn: ({ key }) => {
      const data = queryClient.getQueryData<LeaderboardConfig>(queryKey);
      const currentActiveKeys = data?.activeLeaderboardKeys ?? [];
      return deleteLeaderboardConfig(String(universeId), key, currentActiveKeys);
    },
    ...options,
    onMutate: async (variables, context) => {
      await context.client.cancelQueries({ queryKey });
      const previousData = context.client.getQueryData<LeaderboardConfig>(queryKey);
      if (previousData) {
        // Only filter `leaderboards`; activeLeaderboardKeys must stay intact so mutationFn's cache read sees the pre-mutation set.
        context.client.setQueryData<LeaderboardConfig>(queryKey, {
          ...previousData,
          leaderboards: previousData.leaderboards.filter((item) => item.key !== variables.key),
        });
      }
      return { previousData };
    },
    onError: (error, variables, onMutateResult, context) => {
      if (onMutateResult?.previousData !== undefined) {
        context.client.setQueryData(queryKey, onMutateResult.previousData);
      }
      options.onError?.(error, variables, onMutateResult, context);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void context.client.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

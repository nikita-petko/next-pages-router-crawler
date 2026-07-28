import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { getLeaderboardConfigQueryKey, setActiveLeaderboards } from '../leaderboardConfigApi';
import type { LeaderboardConfig } from '../types';

type Variables = { activeKeys: readonly string[] };
type MutateContext = { previousData: LeaderboardConfig | undefined };

type Options = Omit<UseMutationOptions<void, Error, Variables, MutateContext>, 'mutationFn'>;

export function useSetActiveLeaderboards(
  universeId: string | number | undefined,
  options: Options = {},
) {
  const queryKey = getLeaderboardConfigQueryKey(universeId);

  return useMutation<void, Error, Variables, MutateContext>({
    mutationFn: ({ activeKeys }) => setActiveLeaderboards(String(universeId), activeKeys),
    ...options,
    onMutate: async (variables, context) => {
      await context.client.cancelQueries({ queryKey });
      const previousData = context.client.getQueryData<LeaderboardConfig>(queryKey);
      if (previousData) {
        context.client.setQueryData<LeaderboardConfig>(queryKey, {
          ...previousData,
          activeLeaderboardKeys: [...variables.activeKeys],
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

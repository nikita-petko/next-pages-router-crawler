import { useMutation, useQuery } from '@tanstack/react-query';
import { buildEnhancedAntiCheatConfig } from './antiCheatConfig.mapping';
import type { AntiCheatEnhancedConfig } from './antiCheatConfig.types';
import { useAntiCheatConfigClient } from './AntiCheatConfigProvider';

export const getAntiCheatConfigQueryKey = (placeId: string) =>
  ['antiCheatConfig', placeId] as const;

export const useAntiCheatConfigQuery = (placeId: string) => {
  const client = useAntiCheatConfigClient();
  return useQuery({
    queryKey: getAntiCheatConfigQueryKey(placeId),
    queryFn: () => client.getConfig(placeId),
  });
};

type SetEnhancedAntiCheatContext = {
  previousConfig: AntiCheatEnhancedConfig | undefined;
};

export const useSetEnhancedAntiCheatMutation = (placeId: string) => {
  const client = useAntiCheatConfigClient();
  const queryKey = getAntiCheatConfigQueryKey(placeId);

  return useMutation<void, Error, boolean, SetEnhancedAntiCheatContext>({
    mutationFn: (isEnabled) => client.setConfig(placeId, buildEnhancedAntiCheatConfig(isEnabled)),
    onMutate: async (isEnabled, context) => {
      await context.client.cancelQueries({ queryKey });
      const previousConfig = context.client.getQueryData<AntiCheatEnhancedConfig>(queryKey);
      context.client.setQueryData<AntiCheatEnhancedConfig>(
        queryKey,
        buildEnhancedAntiCheatConfig(isEnabled),
      );
      return { previousConfig };
    },
    onError: (_error, _isEnabled, onMutateResult, context) => {
      context.client.setQueryData(queryKey, onMutateResult?.previousConfig);
    },
    onSuccess: (_data, _isEnabled, _onMutateResult, context) => {
      void context.client.invalidateQueries({ queryKey });
    },
  });
};

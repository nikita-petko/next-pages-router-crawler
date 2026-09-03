import { useMutation, useQueryClient } from '@tanstack/react-query';
import presetChatApiClient from '@modules/clients/presetChatApi';
import type { PresetChatStateResponse } from '../types';
import { presetChatQueryKeys } from './queryKeys';

export function usePublish(universeId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (universeId == null) {
        throw new Error('Universe ID is required');
      }
      return presetChatApiClient.publishPresetVersion(universeId);
    },
    onSuccess: () => {
      if (universeId != null) {
        const queryKey = presetChatQueryKeys.universeState(universeId);
        queryClient.setQueryData<PresetChatStateResponse>(queryKey, (prev) =>
          prev ? { ...prev, overallStatus: 'PUBLISHING' } : prev,
        );
      }
    },
    retry: false,
  });
}

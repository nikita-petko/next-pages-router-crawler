import { useMutation, useQueryClient } from '@tanstack/react-query';
import presetChatApiClient from '@modules/clients/presetChatApi';
import type { PresetChatStateResponse } from '../types';
import { presetChatQueryKeys } from './queryKeys';

export function useRevertToDefaults(universeId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (universeId == null) {
        throw new Error('Universe ID is required');
      }
      return presetChatApiClient.revertToDefaults(universeId);
    },
    onSuccess: () => {
      if (universeId != null) {
        const queryKey = presetChatQueryKeys.universeState(universeId);
        queryClient.setQueryData<PresetChatStateResponse>(queryKey, (prev) =>
          prev ? { ...prev, overallStatus: 'DRAFT' } : prev,
        );
        // The GET returns ROBLOX_DEFAULT after revert, but the defaults aren't
        // published yet — override back to DRAFT after the refetch settles.
        void queryClient.invalidateQueries({ queryKey }).then(() => {
          queryClient.setQueryData<PresetChatStateResponse>(queryKey, (prev) =>
            prev?.overallStatus === 'ROBLOX_DEFAULT' ? { ...prev, overallStatus: 'DRAFT' } : prev,
          );
        });
      }
    },
    retry: false,
  });
}

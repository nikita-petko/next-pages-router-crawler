import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PresetCategoryInput } from '@rbx/client-preset-chat/v1';
import presetChatApiClient from '@modules/clients/presetChatApi';
import { presetChatQueryKeys } from './queryKeys';

export function useUpsertDraft(universeId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: PresetCategoryInput[]) => {
      if (universeId == null) {
        throw new Error('Universe ID is required');
      }
      return presetChatApiClient.upsertPresetDraft(universeId, categories);
    },
    onSuccess: () => {
      if (universeId != null) {
        void queryClient.invalidateQueries({
          queryKey: presetChatQueryKeys.universeState(universeId),
        });
      }
    },
    retry: false,
  });
}

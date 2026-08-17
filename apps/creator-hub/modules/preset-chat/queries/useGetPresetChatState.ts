import { skipToken, useQuery } from '@tanstack/react-query';
import { getUniversePresetState } from '@modules/clients/presetChatApi';
import { presetChatQueryKeys } from './queryKeys';

export function useGetPresetChatState(universeId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: presetChatQueryKeys.universeState(universeId ?? 0),
    queryFn:
      universeId != null && enabled
        ? ({ signal }) => getUniversePresetState(universeId, { signal })
        : skipToken,
    enabled: universeId != null && enabled,
  });
}

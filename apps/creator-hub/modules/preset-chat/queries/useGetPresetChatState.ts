import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetUniversePresetStateResponse } from '@modules/clients/presetChatApi';
import presetChatApiClient from '@modules/clients/presetChatApi';
import { PUBLISH_POLL_INTERVAL_MS } from '../constants/presetChatConstants';
import type { PresetChatStateResponse, PresetStatus } from '../types';
import { presetChatQueryKeys } from './queryKeys';

const PUBLISH_TERMINAL_STATUSES = new Set(['PUBLISHING', 'FAILED_PUBLISH', 'APPROVED']);

// TODO: Remove parseStatus once BE adds `required` + `enum` to the OpenAPI schema — the generated types will be non-optional PresetStatus directly.
const VALID_STATUSES: Set<string> = new Set([
  'ROBLOX_DEFAULT',
  'DRAFT',
  'PUBLISHING',
  'APPROVED',
  'FAILED_PUBLISH',
  'RESET_TO_DEFAULTS',
  'INELIGIBLE',
]);

function parseStatus(value: string | null | undefined): PresetStatus {
  if (value != null && VALID_STATUSES.has(value)) {
    // oxlint-disable-next-line no-unsafe-type-assertion -- validated against VALID_STATUSES set above
    return value as PresetStatus;
  }
  return 'DRAFT';
}

// TODO: Remove toPresetChatState once BE schema marks fields as required — response will match PresetChatStateResponse directly, eliminating null coalescing.
function toPresetChatState(response: GetUniversePresetStateResponse): PresetChatStateResponse {
  return {
    overallStatus: parseStatus(response.overallStatus),
    categoryGroups: (response.categoryGroups ?? []).map((group) => ({
      name: group.name ?? '',
      categories: (group.categories ?? []).map((cat) => ({
        id: cat.id ?? '',
        name: cat.name ?? '',
        state: parseStatus(cat.state),
        presets: (cat.presets ?? []).map((p) => ({
          id: p.id ?? '',
          value: p.value ?? '',
          state: parseStatus(p.state),
        })),
      })),
    })),
  };
}

export function useGetPresetChatState(universeId: number | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = presetChatQueryKeys.universeState(universeId ?? 0);

  return useQuery({
    queryKey,
    queryFn:
      universeId != null && enabled
        ? async ({ signal }) => {
            const response = await presetChatApiClient.getUniversePresetState(universeId, {
              signal,
            });
            const state = toPresetChatState(response);
            const cached = queryClient.getQueryData<PresetChatStateResponse>(queryKey);
            if (
              cached?.overallStatus === 'PUBLISHING' &&
              !PUBLISH_TERMINAL_STATUSES.has(state.overallStatus)
            ) {
              return { ...state, overallStatus: cached.overallStatus };
            }
            return state;
          }
        : skipToken,
    refetchInterval: ({ state }) =>
      state.data?.overallStatus === 'PUBLISHING' ? PUBLISH_POLL_INTERVAL_MS : false,
  });
}

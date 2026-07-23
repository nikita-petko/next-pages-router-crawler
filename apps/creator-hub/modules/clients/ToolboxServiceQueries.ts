import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CategoryType, CreatorInsightData, ToolboxItemDetails } from '@rbx/clients/toolboxService';
import { toolboxClient } from '@modules/clients';

// NOTE: This is needed to prevent query key clashes since the query key isn’t affected by which file it is in.
const KEY_PREFIX = 'toolboxService_';

export const BETA_TAXONOMY_FEATURE_KEY = 'BetaTaxonomyEnabled';

// Centralized query key helper to keep fetch and mutation keys in sync
const betaTaxonomyUserSettingKey = (userId?: number) =>
  [`${KEY_PREFIX}fetchBetaTaxonomyUserSetting`, userId ?? -1] as const;

// eslint-disable-next-line import/prefer-default-export -- mrodyushkin assume that more exports will be added
export function useFetchCreatorInsights(
  assetType: CategoryType = CategoryType.Model,
): UseQueryResult<CreatorInsightData[]> {
  return useQuery({
    enabled: true,
    queryKey: [`${KEY_PREFIX}fetchInsights`, assetType],
    queryFn: async () => {
      const result = await toolboxClient.getCreatorInsightTable(assetType);
      return result;
    },
  });
}

export function useFetchItemDetails(
  assetId: number,
  enabled: boolean = true,
): UseQueryResult<ToolboxItemDetails | null> {
  return useQuery({
    enabled,
    queryKey: [`${KEY_PREFIX}fetchItemDetails`, assetId],
    queryFn: async () => {
      if (!assetId || assetId <= 0) {
        return null;
      }

      const result = await toolboxClient.getItemDetails([assetId]);
      const items = result?.items ?? [];
      return items.length === 1 ? items[0] : null;
    },
  });
}

export function useFetchBetaTaxonomyUserSetting(userId?: number): UseQueryResult<boolean> {
  return useQuery({
    enabled: userId !== undefined,
    queryKey: betaTaxonomyUserSettingKey(userId),
    queryFn: async () => {
      return toolboxClient.getUserSettingsFeatureKey(BETA_TAXONOMY_FEATURE_KEY);
    },
  });
}

export function useUpdateBetaTaxonomyUserSetting(
  userId?: number,
): UseMutationResult<void, unknown, boolean> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [`${KEY_PREFIX}updateBetaTaxonomyUserSetting`],
    mutationFn: async (enabled: boolean) => {
      await toolboxClient.setUserSettingsFeatureKey(BETA_TAXONOMY_FEATURE_KEY, enabled);
    },
    onSuccess: (_data, enabled: boolean) => {
      queryClient.setQueriesData<boolean>(
        { queryKey: betaTaxonomyUserSettingKey(userId), exact: true },
        enabled,
      );
    },
  });
}

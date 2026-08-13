import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getConfigRepositoryFull,
  updateDraft,
  publishDraft,
} from '@modules/clients/creatorConfigsPublicApi';
import { useUniverseIdDeprecatedFromAnalytics as useUniverseId } from '@modules/experience-analytics-shared/context/useUniverseID';

const JOURNEY_REPOSITORY = 'JourneysConfig' as const;

// Matches journeys_config.proto — snake_case, stage_index is 1-based (1–10)
export type JourneyConfigNode = {
  node_name: string;
};

export type JourneyConfigStage = {
  stage_index: number;
  nodes: JourneyConfigNode[];
};

export type JourneyConfigPayload = {
  stages: JourneyConfigStage[];
};

export type JourneyEntry = {
  journeyName: string;
  config: JourneyConfigPayload;
  lastModified?: string;
};

const journeyConfigQueryKey = (universeId: number | undefined) =>
  ['journey-configs', universeId ?? -1] as const;

function isJourneyConfigPayload(value: unknown): value is JourneyConfigPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'stages' in value && Array.isArray(value.stages);
}

export function useJourneyConfigs(universeId: number | undefined) {
  return useQuery({
    queryKey: journeyConfigQueryKey(universeId),
    queryFn: async (): Promise<JourneyEntry[]> => {
      const repo = await getConfigRepositoryFull({
        universeId: String(universeId),
        repository: JOURNEY_REPOSITORY,
      });
      const entries = repo.entries ?? {};
      return Object.entries(entries).flatMap(([journeyName, entry]) => {
        if (!isJourneyConfigPayload(entry.value)) {
          return [];
        }
        return [{ journeyName, config: entry.value, lastModified: entry.lastModifiedTime }];
      });
    },
    enabled: universeId !== undefined && Number.isFinite(universeId) && universeId > 0,
  });
}

export type UseCurrentJourneyConfigResult = {
  data: JourneyEntry | undefined;
  isLoading: boolean;
  isFetched: boolean;
  isError: boolean;
};

/**
 * Fetches a single journey config by name via the shared list query. There's
 * no by-name API, so this fetches the full list and filters client-side, but
 * centralizes found/not-found/error state in one place.
 */
export function useCurrentJourneyConfig(
  universeId: number,
  journeyName: string | undefined,
): UseCurrentJourneyConfigResult {
  const { data: configs, isLoading, isFetched, isError } = useJourneyConfigs(universeId);

  const data = useMemo(
    () => (journeyName ? configs?.find((entry) => entry.journeyName === journeyName) : undefined),
    [configs, journeyName],
  );

  return { data, isLoading, isFetched, isError };
}

type SaveJourneyConfigVariables = JourneyEntry & { originalName?: string };

export function useSaveJourneyConfig() {
  const universeId = useUniverseId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ journeyName, config, originalName }: SaveJourneyConfigVariables) => {
      const opts = { universeId: String(universeId), repository: JOURNEY_REPOSITORY };
      const entries: Record<string, JourneyConfigPayload | null> = { [journeyName]: config };
      if (originalName !== undefined && originalName !== journeyName) {
        entries[originalName] = null;
      }
      const { draftHash } = await updateDraft(opts, { entries });
      await publishDraft(opts, { draftHash, deploymentStrategy: 'Immediate' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journeyConfigQueryKey(universeId) });
    },
  });
}

export function useDeleteJourneyConfig(universeIdOverride?: number) {
  const contextUniverseId = useUniverseId();
  const universeId = universeIdOverride ?? contextUniverseId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journeyName: string) => {
      const opts = { universeId: String(universeId), repository: JOURNEY_REPOSITORY };
      const { draftHash } = await updateDraft(opts, { entries: { [journeyName]: null } });
      await publishDraft(opts, { draftHash, deploymentStrategy: 'Immediate' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journeyConfigQueryKey(universeId) });
    },
  });
}

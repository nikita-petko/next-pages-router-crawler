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

const journeyConfigQueryKey = (universeId: number) => ['journey-configs', universeId] as const;

function isJourneyConfigPayload(value: unknown): value is JourneyConfigPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'stages' in value && Array.isArray(value.stages);
}

export function useJourneyConfigs(universeIdOverride?: number) {
  const contextUniverseId = useUniverseId();
  const universeId = universeIdOverride ?? contextUniverseId;

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
    enabled: Number.isFinite(universeId) && universeId > 0,
  });
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

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import gamesClient from '@modules/clients/games';
import { th2QueryKeys } from '../queryKeys';
import { isMocksEnabled, TH2_QUERY_OPTIONS } from '../utils';

export type ExperienceDetail = {
  url: string;
  universeId: number;
  name: string;
  visits?: number;
};

const MOCK_GAME_DETAILS: Record<number, { name: string }> = {
  11156779721: { name: 'Sword Burst 3' },
  3233893879: { name: 'Islands' },
  65241: { name: 'MeepCity' },
  920587237: { name: 'Jailbreak' },
  13822889: { name: 'Phantom Forces' },
};

async function fetchGameDetails(universeIds: number[]) {
  const resp = await gamesClient.getDetails(universeIds);
  return resp.data ?? [];
}

export function useExperienceDetails(universeIds: number[]) {
  const mocks = isMocksEnabled();

  const { data: gamesData, isLoading } = useQuery({
    queryKey: th2QueryKeys.gameDetails.list(universeIds),
    queryFn: () => fetchGameDetails(universeIds),
    enabled: !mocks && universeIds.length > 0,
    ...TH2_QUERY_OPTIONS,
  });

  const details: ExperienceDetail[] = useMemo(() => {
    if (mocks) {
      return universeIds.map((id) => {
        const mock = MOCK_GAME_DETAILS[id];
        return {
          url: `https://www.roblox.com/games/${id}`,
          universeId: id,
          name: mock?.name ?? `Experience ${id}`,
        };
      });
    }

    const byUniverseId = new Map(
      (gamesData ?? []).filter((g) => g.id != null).map((g) => [g.id as number, g]),
    );

    return universeIds.map((uid) => {
      const game = byUniverseId.get(uid);
      const visitsRaw =
        game && typeof game === 'object' && 'visits' in game
          ? (game as { visits?: unknown }).visits
          : undefined;
      const visits = typeof visitsRaw === 'number' ? visitsRaw : undefined;
      return {
        url: game?.rootPlaceId
          ? `https://www.roblox.com/games/${game.rootPlaceId}`
          : `https://www.roblox.com/games/${uid}`,
        universeId: uid,
        name: game?.name ?? `Experience ${uid}`,
        visits,
      };
    });
  }, [universeIds, gamesData, mocks]);

  return { details, isLoading: !mocks && universeIds.length > 0 && isLoading };
}

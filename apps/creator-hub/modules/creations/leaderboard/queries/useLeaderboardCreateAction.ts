import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { getLeaderboardConfigQueryKey } from '../leaderboardConfigApi';
import { classifyLeaderboardFailure, logLeaderboardCreateResult } from '../telemetry';
import type { LeaderboardConfig, LeaderboardConfigEntry } from '../types';
import { generateLeaderboardKey } from '../utils/generateLeaderboardKey';
import { useSaveLeaderboardConfig } from './useSaveLeaderboardConfig';

export function useLeaderboardCreateAction() {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { mutateAsync, isPending } = useSaveLeaderboardConfig(universeId);

  const save = useCallback(
    async (entry: LeaderboardConfigEntry, isActive: boolean) => {
      const cached = queryClient.getQueryData<LeaderboardConfig>(
        getLeaderboardConfigQueryKey(universeId),
      );
      const existingKeys = cached?.leaderboards.map((leaderboard) => leaderboard.key) ?? [];
      const key = generateLeaderboardKey(entry.leaderboard_name, existingKeys);
      try {
        await mutateAsync({ key, entry, isActive });
        logLeaderboardCreateResult({ universeId, success: true });
      } catch (err) {
        logLeaderboardCreateResult({
          universeId,
          success: false,
          failureReason: classifyLeaderboardFailure(err),
        });
        throw err;
      }
    },
    [mutateAsync, queryClient, universeId],
  );

  const formSheetProps = useMemo(
    () => ({ save, onSuccess: close, isPending }),
    [save, close, isPending],
  );

  return { isOpen, open, close, formSheetProps };
}

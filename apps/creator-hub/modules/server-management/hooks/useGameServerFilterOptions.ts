import { useCallback, useEffect, useRef, useState } from 'react';
import type { FilterField } from '@rbx/client-server-management-service/v1';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { serverManagementApi } from '../clients/serverManagementApi';

const useGameServerFilterOptions = () => {
  const { gameDetails } = useCurrentGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const { current } = abortControllerRef;
    return () => {
      current?.abort();
    };
  }, []);

  const fetchFilterOptions = useCallback(
    async (placeId: number, filter?: FilterField) => {
      if (!gameDetails?.id || !placeId) {
        setError(new Error('Place ID missing from fetch filter options call'));
        return null;
      }

      // Abort previous in-flight requests
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const response = await serverManagementApi.gameServersGetFilterOptions({
          universeId: gameDetails.id,
          placeId,
          filter,
        });

        if (controller.signal.aborted) {
          return null;
        }

        return response;
      } catch (err) {
        if (controller.signal.aborted) {
          return null;
        }
        setError(err instanceof Error ? err : new Error('Failed to fetch filter options'));
        return null;
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [gameDetails?.id],
  );

  return {
    fetchFilterOptions,
    isLoading,
    error,
  };
};

export default useGameServerFilterOptions;

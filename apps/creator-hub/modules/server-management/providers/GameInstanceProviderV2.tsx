import type { FunctionComponent, PropsWithChildren } from 'react';
import { useCallback, useState, useMemo, useEffect } from 'react';
import type {
  ForecastRestartResponse,
  LaunchRestartResponse,
  ListRestartStatusesResponse,
  RestartsLaunchRestartRequest,
  RestartsLaunchRestartOperationRequest,
} from '@rbx/client-server-management-service/v1';
import { RestartState } from '@rbx/client-server-management-service/v1';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { restartsApi } from '../clients/serverManagementApi';
import { POLLING_CONSTANTS } from '../constants';
import { GameInstanceV2StateContext, GameInstanceV2ActionsContext } from './GameInstanceContextV2';

const GameInstanceProviderV2: FunctionComponent<PropsWithChildren<object>> = ({ children }) => {
  const [forecastResult, setForecastResult] = useState<ForecastRestartResponse | undefined>(
    undefined,
  );
  const [restartStatuses, setRestartStatuses] = useState<ListRestartStatusesResponse | undefined>(
    undefined,
  );
  const [isForecasting, setIsForecasting] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState<boolean>(false);
  const { gameDetails } = useCurrentGame();
  const gameId: number | undefined = useMemo(() => gameDetails?.id, [gameDetails]);

  const handleListRestartStatuses = useCallback(async (): Promise<ListRestartStatusesResponse> => {
    if (!gameId) {
      throw new Error('Game ID is required to list restart statuses');
    }

    setIsFetchingStatus(true);
    try {
      const request = { universeId: gameId };
      const response = await restartsApi.restartsListRestartStatuses(request);
      setRestartStatuses(response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to list restart statuses: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error },
      );
    } finally {
      setIsFetchingStatus(false);
    }
  }, [gameId]);

  const handleForecastRestart = useCallback(async (): Promise<ForecastRestartResponse> => {
    if (!gameId) {
      throw new Error('Game ID is required to forecast restart');
    }

    setIsForecasting(true);
    try {
      const request = { universeId: gameId };
      const response = await restartsApi.restartsForecastRestart(request);
      setForecastResult(response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to forecast restart: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error },
      );
    } finally {
      setIsForecasting(false);
    }
  }, [gameId]);

  const handleLaunchRestart = useCallback(
    async (request: RestartsLaunchRestartRequest): Promise<LaunchRestartResponse> => {
      if (!gameId) {
        throw new Error('Game ID is required to launch restart');
      }

      setIsLaunching(true);
      try {
        const launchRequest: RestartsLaunchRestartOperationRequest = {
          universeId: gameId,
          restartsLaunchRestartRequest: request,
        };
        const response = await restartsApi.restartsLaunchRestart(launchRequest);
        if (response.id) {
          handleListRestartStatuses();
        }
        return response;
      } catch (error) {
        throw new Error(
          `Failed to launch restart: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { cause: error },
        );
      } finally {
        setIsLaunching(false);
      }
    },
    [gameId, handleListRestartStatuses],
  );

  useEffect(() => {
    const isRestartInProgress =
      !!restartStatuses?.restartStatuses &&
      Object.values(restartStatuses.restartStatuses).some((restart) =>
        Object.values(restart.placeRestartStatuses ?? {}).some(
          (placeStatus) =>
            placeStatus.state === RestartState.Delaying ||
            placeStatus.state === RestartState.Restarting,
        ),
      );

    if (isRestartInProgress) {
      const interval = setInterval(() => {
        handleListRestartStatuses();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => clearInterval(interval);
    }
    return;
  }, [restartStatuses, handleListRestartStatuses]);

  const actionsValue = useMemo(
    () => ({
      handleForecastRestart,
      handleLaunchRestart,
      handleListRestartStatuses,
    }),
    [handleForecastRestart, handleLaunchRestart, handleListRestartStatuses],
  );

  const stateValue = useMemo(
    () => ({
      forecastResult,
      restartStatuses,
      isForecasting,
      isLaunching,
      isFetchingStatus,
    }),
    [forecastResult, restartStatuses, isForecasting, isLaunching, isFetchingStatus],
  );

  return (
    <GameInstanceV2ActionsContext.Provider value={actionsValue}>
      <GameInstanceV2StateContext.Provider value={stateValue}>
        {children}
      </GameInstanceV2StateContext.Provider>
    </GameInstanceV2ActionsContext.Provider>
  );
};

export default GameInstanceProviderV2;
